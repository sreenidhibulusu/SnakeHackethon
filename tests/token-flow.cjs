const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function screen(page, profiles) {
    const elements = new Map();
    const classes = new Set();
    const make = () => ({dataset:{}, style:{setProperty(){}}, children:[], attrs:{}, value:'', hidden:true,
        setAttribute(key,value){this.attrs[key]=value;}, addEventListener(key,fn){this[key]=fn;},
        append(child){this.children.push(child);}, focus(){}, querySelectorAll(){return [];}});
    const get = id => {
        if ((id === 'viking-name' && page !== 'start') || (id === 'result-summary' && page !== 'result')) return null;
        if (!elements.has(id)) elements.set(id,make());
        return elements.get(id);
    };
    const location = {search:'?pair=1', pathname:`/${page === 'start' ? 'index' : page}.html`};
    const listeners = {};
    const timers = [];
    const window = {location, history:{replaceState(a,b,url){location.search=url.slice(url.indexOf('?'));}}, addEventListener(type, handler){listeners[type]=handler;},setInterval(handler){timers.push(handler);}};
    const loads = [];
    class EventSource {
        static OPEN = 1;
        constructor(){this.readyState=1; window.events=this;}
        close(){}
    }
    const context = vm.createContext({window, URLSearchParams, EventSource,
        document:{body:{dataset:{page},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}},
            getElementById:get, createElement:make, querySelector:()=>get('builder'), querySelectorAll:()=>['choices','start-weapons','start-seasons'].flatMap(id=>get(id).children)},
        localStorage:{
            getItem(key){loads.push(key); return profiles.get(key) ?? null;},
            setItem(key,value){profiles.set(key,value);}
        }});
    for (const file of ['storage.js','app.js','channel.js','display.js']) vm.runInContext(source(file),context);
    const scan = (token, station=page, pair='1') => window.events.onmessage({data:JSON.stringify({message:JSON.stringify({action:'OPEN_STATION',token,station,pair})})});
    return {get,window,scan,loads,classes, focus:()=>listeners.focus(), tick:async()=>{for(const timer of timers) await timer();}, storageChanged:token=>listeners.storage({storageArea:context.localStorage, key:window.vikingStore.keyFor(token)})};
}
(async()=>{
    const profiles = new Map();
    const start = screen('start', profiles);
    await start.scan('A');
    assert.equal(start.get('builder').hidden,false);
    start.get('viking-name').value = 'Thor';
    start.get('viking-name').input({target:start.get('viking-name')});
    start.get('choices').children.find(button=>button.dataset.choice==='woman').click();
    await start.window.vikingApp.finish();
    const readsBeforeRescan = start.loads.length;
    await start.scan('A');
    assert.equal(start.loads.length,readsBeforeRescan + 1, 'Same ID checks saved data without resetting');
    assert.equal(start.get('viking-name').value,'Thor');
    assert(start.window.location.search.includes('token=A'));
    await start.scan('B');
    assert.equal(start.get('viking-name').value,'');
    assert.equal(start.get('weapon-art').innerHTML,'');
    assert.equal(start.get('rag-patches').style.display,'');
    await start.scan('A');
    assert.equal(start.get('viking-name').value,'Thor');
    await start.get('done').click();
    assert.equal(start.get('builder').hidden,true);
    assert(!start.classes.has('scan-glow'));
    const loadsBefore = start.loads.length;
    await start.scan('A');
    assert.equal(start.get('builder').hidden,false);
    assert.equal(start.loads.length,loadsBefore + 1, 'Same token reopens after Done using current saved data');
    await start.scan('B','weapons');
    await start.scan('B','start','2');
    await start.scan('bad!');
    assert.equal(start.window.vikingApp.token,'A');
    const seasons = screen('seasons',profiles);
    await seasons.scan('A');
    seasons.get('choices').children.find(button=>button.dataset.choice==='winter').click();
    await seasons.window.vikingApp.finish();
    const weapons = screen('weapons',profiles);
    await weapons.scan('A');
    weapons.get('choices').children.find(button=>button.dataset.choice==='spear').click();
    await weapons.window.vikingApp.finish();
    // Simulate a suspended starting tab that missed all cross-tab storage events.
    await start.scan('A');
    assert(start.get('weapon-art').innerHTML.includes('m354 461'), 'Same-token scan must restore the saved spear');
    assert.equal(start.get('fur').style.display,'');
    assert.equal(start.get('viking-name').value,'Thor');
    const result = screen('result',profiles);
    await result.scan('A');
    assert.equal(result.get('result-summary').textContent,'Woman · Spear · Winter');
    assert.equal(result.get('preview-name').textContent,'ᚦᛟᚱ');
    await result.scan('B');
    assert.equal(result.get('result-summary').textContent,'Man · No weapon · Ragged clothing');
    const reopenedTab = screen('result', profiles);
    await reopenedTab.scan('A');
    assert.equal(reopenedTab.get('result-summary').textContent,'Woman · Spear · Winter');
    weapons.get('choices').children.find(button=>button.dataset.choice==='axe').click();
    await weapons.window.vikingApp.finish();
    await reopenedTab.storageChanged('A');
    assert.equal(reopenedTab.get('result-summary').textContent,'Woman · Axe · Winter');
    await start.focus();
    assert(start.get('weapon-art').innerHTML.includes('m354 414'), 'Returning to the start tab refreshes saved equipment');
    const separateTab = screen('result', new Map());
    await separateTab.scan('A');
    assert.equal(separateTab.get('result-summary').textContent,'Man · No weapon · Ragged clothing');
    // Rapid alternating scans must leave the most recently scanned token visible.
    await Promise.all([result.scan('A'),result.scan('B')]);
    assert.equal(result.window.vikingApp.token,'B');
    assert.equal(result.get('result-summary').textContent,'Man · No weapon · Ragged clothing');
    // The starting station renders saved equipment, with no equipment controls.
    await start.storageChanged('A');
    assert(start.get('weapon-art').innerHTML.length > 100);
    assert.equal(start.get('fur').style.display, '');
    assert.equal(start.get('rag-patches').style.display, 'none');
    assert(!source('index.html').includes('id="start-weapons"'));
    assert(!source('index.html').includes('id="start-seasons"'));
    assert.equal(start.get('choices').children.length, 2);
    assert.throws(()=>start.window.vikingStore.save('A', 'start', {weapon:'bow'}));
    assert.throws(()=>start.window.vikingStore.save('A', 'start', {season:'summer'}));
    // Changing name or character keeps equipment intact.
    start.get('viking-name').value = 'Astrid';
    start.get('viking-name').input({target:start.get('viking-name')});
    start.get('choices').children.find(button=>button.dataset.choice==='man').click();
    await start.window.vikingApp.finish();
    const saved = JSON.parse(profiles.get(start.window.vikingStore.keyFor('A')));
    assert.equal(saved.weapon, 'axe');
    assert.equal(saved.season, 'winter');
    assert(start.get('weapon-art').innerHTML.length > 100);
    const otherChild = screen('start', profiles);
    await otherChild.scan('B');
    otherChild.get('viking-name').value = 'Bjorn';
    otherChild.get('viking-name').input({target:otherChild.get('viking-name')});
    await otherChild.window.vikingApp.finish();
    const otherProfile = profiles.get(otherChild.window.vikingStore.keyFor('B'));
    // Only an explicit reset clears the current token's saved character.
    await start.get('reset-viking').click();
    assert.equal(start.window.vikingApp.token, 'A');
    assert(start.window.location.search.includes('token=A'));
    assert.equal(start.get('viking-name').value, '');
    assert.equal(start.get('weapon-art').innerHTML, '');
    assert.equal(start.get('rag-patches').style.display, '');
    assert.equal(start.get('choices').children.find(button=>button.dataset.choice==='man').attrs['aria-pressed'], 'true');
    assert.equal(profiles.get(otherChild.window.vikingStore.keyFor('B')), otherProfile);
    await reopenedTab.storageChanged('A');
    assert.equal(reopenedTab.get('result-summary').textContent, 'Man · No weapon · Ragged clothing');
    await start.scan('B');
    await start.scan('A');
    assert.equal(start.get('viking-name').value, '');
    for (const file of ['seasons.html','weapons.html','result.html']) assert(!source(file).includes('id="reset-viking"'));
    // All station tabs are already open when a child edits their name.
    // Simulate dropped storage events and no focus changes.
    const renameProfiles = new Map();
    const naming = screen('start', renameProfiles);
    const clothing = screen('seasons', renameProfiles);
    const equipment = screen('weapons', renameProfiles);
    const finish = screen('result', renameProfiles);
    for (const tab of [naming, clothing, equipment, finish]) await tab.scan('rename-child');
    naming.get('viking-name').value = 'Astrid';
    naming.get('viking-name').input({target:naming.get('viking-name')});
    await naming.window.vikingApp.finish();
    for (const tab of [clothing, equipment, finish]) {
        await tab.tick();
        assert.equal(tab.get('preview-name').textContent, 'ᚨᛋᛏᚱᛁᛞ');
        assert.equal(tab.get('preview-name').attrs['aria-label'], 'Astrid');
        assert.equal(tab.window.vikingApp.token,'rename-child');
    }
    // Editing equipment after the rename must preserve the saved name.
    equipment.get('choices').children.find(button=>button.dataset.choice==='axe').click();
    clothing.get('choices').children.find(button=>button.dataset.choice==='winter').click();
    await equipment.window.vikingApp.finish();
    await clothing.window.vikingApp.finish();
    await finish.tick();
    assert.equal(finish.get('preview-name').attrs['aria-label'], 'Astrid');
    assert.equal(finish.get('result-summary').textContent, 'Man · Axe · Winter');
    // Persist the name immediately, not in a deferred promise callback.
    naming.get('viking-name').value = 'Sigrid';
    naming.get('viking-name').input();
    assert.equal(JSON.parse(renameProfiles.get(naming.window.vikingStore.keyFor('rename-child'))).name,'Sigrid');
    // Change events and browser-filled values must also be saved.
    naming.get('viking-name').value = 'Freya';
    naming.get('viking-name').change();
    assert.equal(JSON.parse(renameProfiles.get(naming.window.vikingStore.keyFor('rename-child'))).name,'Freya');
    // Done commits the actual field even if no input/change event was received.
    naming.get('viking-name').value = 'Ragnar';
    await naming.get('done').click();
    assert.equal(naming.get('builder').hidden,true);
    assert.equal(JSON.parse(renameProfiles.get(naming.window.vikingStore.keyFor('rename-child'))).name,'Ragnar');
    for (const tab of [clothing, equipment, finish]) {
        await tab.scan('rename-child');
        assert.equal(tab.get('preview-name').attrs['aria-label'],'Ragnar');
    }
    // Each choice station has separate question and accumulated-character views.
    for (const station of ['start', 'weapons', 'seasons']) {
        const tab = screen(station, renameProfiles);
        await tab.scan('rename-child');
        assert.equal(tab.get('choice-view').hidden, false);
        assert.equal(tab.get('viking-view').hidden, true);
        if (station === 'start') tab.get('viking-name').value = 'Liv';
        await tab.get('show-viking').click();
        assert.equal(tab.get('choice-view').hidden, true);
        assert.equal(tab.get('viking-view').hidden, false);
        assert.equal(tab.get('preview-latin-name').textContent, 'Liv');
        assert(tab.get('weapon-art').innerHTML.length > 100);
        await tab.scan('rename-child');
        assert.equal(tab.get('viking-view').hidden, false, 'Repeat scans preserve the current view');
        tab.get('pick-again').click();
        assert.equal(tab.get('choice-view').hidden, false);
        assert.equal(tab.get('viking-view').hidden, true);
        await tab.get('show-viking').click();
        await tab.scan('new-visitor');
        assert.equal(tab.get('choice-view').hidden, false, 'New visitors start at the question');
        await tab.get('show-viking').click();
        await tab.get('done').click();
        await tab.scan('new-visitor');
        assert.equal(tab.get('choice-view').hidden, false, 'A new visit starts at the question');
    }
    await finish.scan('rename-child');
    assert.equal(finish.get('viking-view').hidden, false, 'Results open on the accumulated Viking');
    const noToken = screen('start', new Map());
    noToken.get('viking-name').value = 'Unsaved';
    noToken.get('viking-name').input();
    assert(noToken.get('save-status').textContent.includes('Scan a token'));
    await assert.rejects(noToken.window.vikingApp.finish());
    console.log('Passed: token isolation, same-ID scans, switching/restoration, new-token defaults, station/pair filtering, Done, rapid scans, persistent profiles shared across station tabs, explicit token reset, reset persistence, isolation of other tokens, read-only equipment rendering at the first station, live name updates, immediate name persistence, change events, Done committing field values, missing-token save errors, question/preview views, Pick again, and new-visit view resets.');
})().catch(error=>{console.error(error);process.exitCode=1;});

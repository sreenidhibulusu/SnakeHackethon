'use strict';
const weapons = {
    spear: { name: 'Spear', note: 'Keep your distance', art: '<path d="m354 461 0-310" stroke="#85633d" stroke-width="9"/><path d="m354 76-15 59 15 23 15-23Z" fill="url(#steel)"/><path d="M354 83v68" stroke="#e6ece4" stroke-width="2"/><path d="M347 161h14m-14 7h14" stroke="#c2a56b" stroke-width="4"/>' },
    bow: { name: 'Bow', note: 'Trust your aim', art: '<path d="M349 181q106 132 0 264" fill="none" stroke="#8f663c" stroke-width="9"/><path d="m349 181 4 264" fill="none" stroke="#e4d8b6" stroke-width="2"/><path d="M317 318h110" stroke="#8b613b" stroke-width="4"/><path d="m438 318-17-7v14Z" fill="url(#steel)"/><path d="m321 318-10-9m10 9-10 9" stroke="#a68655"/>' },
    sword: { name: 'Sword', note: 'Stand your ground', art: '<path d="m346 306-3-130 12-32 12 32-3 130Z" fill="url(#steel)"/><path d="M355 164v135" stroke="#e9eee7" stroke-width="2"/><path d="M332 305h45v9h-45Z" fill="#b89a5c"/><path d="M350 314h10v50h-10Z" fill="#68513a"/><path d="m350 323 10 5m-10 5 10 5m-10 5 10 5" stroke="#ae9364" stroke-width="2"/><circle cx="355" cy="369" r="8" fill="#b89a5c"/>' },
    axe: { name: 'Axe', note: 'Make your mark', art: '<path d="m354 414 0-223" stroke="#85633d" stroke-width="10"/><path d="M352 228q23 10 43-11l8 62q-30-25-51-13Z" fill="url(#steel)"/><path d="m395 219 5 54" stroke="#e9eee6" stroke-width="4"/><path d="M348 229h13v35h-13Z" fill="#71837a"/><path d="m350 342 9 4m-9 4 9 4m-9 4 9 4" stroke="#c9a773" stroke-width="3"/>' }
};
const seasons = {
    spring: { name: 'Spring', icon: '✿', title: 'The Thaw Wanderer', description: 'A light green tunic, short cloak, and leather boots for fresh trails and spring rain.', light: '#849866', dark: '#566d49', cape: '#8b9b72', region: 'THE GREEN TRAILS', label: 'Fresh & light', explorer: 'Spring wanderer', fur: false },
    summer: { name: 'Summer', icon: '☀', title: 'The Sun Voyager', description: 'An airy linen tunic and light leather boots for long days beneath the summer sun.', light: '#c9b684', dark: '#aa9163', cape: '#b6a173', region: 'THE SUNLIT COAST', label: 'Cool & breezy', explorer: 'Summer voyager', fur: false },
    autumn: { name: 'Autumn', icon: '❧', title: 'The Amber Ranger', description: 'A rust-colored wool tunic, traveling cloak, and sturdy boots for crisp autumn days.', light: '#ac7654', dark: '#7d4d36', cape: '#786647', region: 'THE AMBER WOODS', label: 'Warm & layered', explorer: 'Autumn ranger', fur: false },
    winter: { name: 'Winter', icon: '❄', title: 'The Frostguard', description: 'A wool tunic, fur mantle, and heavy boots to brave the northern cold.', light: '#60776c', dark: '#344e46', cape: '#58695e', region: 'THE FROSTLANDS', label: 'Cozy & rugged', explorer: 'Winter explorer', fur: true }
};
const runeLetters = {
    a:'ᚨ', b:'ᛒ', c:'ᚲ', d:'ᛞ', e:'ᛖ', f:'ᚠ', g:'ᚷ', h:'ᚺ',
    i:'ᛁ', j:'ᛃ', k:'ᚲ', l:'ᛚ', m:'ᛗ', n:'ᚾ', o:'ᛟ', p:'ᛈ',
    q:'ᚲ', r:'ᚱ', s:'ᛋ', t:'ᛏ', u:'ᚢ', v:'ᚹ', w:'ᚹ', x:'ᚲᛋ',
    y:'ᛁ', z:'ᛉ', æ:'ᚨᛖ', ø:'ᛟ', å:'ᚨ', þ:'ᚦ', ð:'ᚦ'
};
function toRunes(name) {
    return name.toLowerCase().replace(/th/g, 'þ').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split('').map(letter => runeLetters[letter] || letter).join('');
}

const $ = id => document.getElementById(id);
const params = new URLSearchParams(window.location.search);
const state = {
    gender: params.get('gender') === 'woman' ? 'woman' : 'man',
    weapon: Object.hasOwn(weapons, params.get('weapon')) ? params.get('weapon') : '',
    season: Object.hasOwn(seasons, params.get('season')) ? params.get('season') : '',
    name: (params.get('name') || '').slice(0, 32)
};
const page = document.body.dataset.page;
const defaults = { man: 'Eirik', woman: 'Freya' };
function pageUrl(file, changes = {}, reset = false) {
    const query = new URLSearchParams();
    if (params.has('pair')) query.set('pair', params.get('pair'));
    if (!reset) {
        for (const [key, value] of Object.entries({...state, ...changes})) {
            if (value) query.set(key, value);
        }
    }
    return file + (query.size ? '?' + query.toString() : '');
}
$('character-art').innerHTML = window.vikingIllustration;
const choices = page === 'start' ? { man: {name:'Man'}, woman: {name:'Woman'} }
    : page === 'weapons' ? weapons : page === 'seasons' ? seasons : null;
const key = {start:'gender', weapons:'weapon', seasons:'season'}[page];
const next = {start:'seasons.html', seasons:'weapons.html', weapons:'result.html'}[page];
if (choices) {
    for (const [value, choice] of Object.entries(choices)) {
        const link = document.createElement('a');
        link.className = 'option';
        link.textContent = choice.name;
        link.href = pageUrl(next, {[key]:value});
        $('choices').append(link);
    }
}
function render() {
    const season = seasons[state.season] || {name: 'Ragged clothing', light: '#a49678', dark: '#776b53', cape: '#776b53', fur: false};
    const weapon = weapons[state.weapon];
    const ragged = !state.season;
    const tunicShape = ragged
        ? 'M209 223q51-18 100 0l12 167-13-4-7 15-14-8-10 13-15-10-13 8-12-13-15 7-9-13-13 5Z'
        : 'M209 223q51-18 100 0l12 167q-59 23-121 0Z';
    $('tunic').setAttribute('d', tunicShape);
    $('tunic-texture').setAttribute('d', tunicShape);
    $('rag-patches').style.display = ragged ? '' : 'none';
    for (const id of ['tunic-trim', 'strap', 'strap-trim', 'buckle']) {
        $(id).style.display = ragged ? 'none' : '';
    }
    $('helmet').style.display = 'none';
    const name = state.name.trim() || defaults[state.gender];
    $('viking').style.setProperty('--cloth-light', season.light);
    $('viking').style.setProperty('--cloth-dark', season.dark);
    $('cape').setAttribute('fill', season.cape);
    $('cape').style.display = ragged || state.season === 'summer' ? 'none' : '';
    $('cape').setAttribute('d', state.season === 'spring' ? 'M204 226q-25 35-28 118 83 34 169-1-8-80-31-117Z' : 'M204 226q-30 37-37 204 93 43 187-1-10-168-40-203Z');
    $('fur').style.display = season.fur ? '' : 'none';
    $('snow').style.display = season.fur ? '' : 'none';
    $('weapon-art').innerHTML = weapon?.art || '';
    $('shield').style.display = !weapon || state.weapon === 'bow' ? 'none' : '';
    $('beard-group').style.display = state.gender === 'woman' ? 'none' : '';
    $('hair').setAttribute('d', state.gender === 'woman'
        ? 'M216 153q-15-53 23-58 9-16 35-9 41 2 33 67l9 89-15 25-12-15 5-125q-36 12-62-2l-4 127-13 15-14-25Z'
        : 'M216 153q-15-53 23-58 9-16 35-9 41 2 33 67l-13-26q-36 12-62-2Z');
    $('preview-name').textContent = page === 'result' ? toRunes(name) : '';
    $('preview-name').setAttribute('aria-label', name);
    $('character-title').textContent = `${name}, Viking ${state.gender}, ${weapon ? 'holding a ' + weapon.name.toLowerCase() : 'unarmed'}, ${ragged ? 'simple ragged clothing' : season.name.toLowerCase() + ' clothing'}`;
    if ($('result-summary')) $('result-summary').textContent = `${state.gender === 'woman' ? 'Woman' : 'Man'} · ${weapon?.name || 'No weapon'} · ${season.name}`;
    document.querySelectorAll('[data-destination]').forEach(link => {
        link.href = pageUrl(link.dataset.destination, {}, link.hasAttribute('data-reset'));
    });
}
if ($('viking-name')) {
    $('viking-name').value = state.name;
    $('viking-name').addEventListener('input', event => {
        state.name = event.target.value;
        render();
        // Keep the current name when the result is refreshed or shared.
        try { window.history.replaceState(null, '', pageUrl('result.html')); } catch {}
    });
}
render();

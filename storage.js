// One Viking per token ID, persisted across tabs on this website in this browser.
window.vikingStore = (() => {
    const defaults = () => ({gender:'man', weapon:'', season:'', name:''});
    const validToken = token => typeof token === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(token);
    const storageKey = token => `build-a-viking:token:${token}`;
    const fields = {start:['gender','name'], seasons:['season'], weapons:['weapon']};
    function load(token) {
        if (!validToken(token)) throw new Error('Invalid token ID.');
        const saved = localStorage.getItem(storageKey(token));
        return saved ? JSON.parse(saved) : defaults();
    }
    return {
        validToken,
        keyFor: storageKey,
        async load(token) {
            try { return load(token); }
            catch { throw new Error('Could not read this token. Check that local storage is enabled.'); }
        },
        reset(token) {
            if (!validToken(token)) throw new Error('Invalid token ID.');
            try {
                localStorage.setItem(storageKey(token), JSON.stringify(defaults()));
            } catch {
                throw new Error('Could not reset your Viking. Check that local storage is enabled and try again.');
            }
        },
        save(token, station, changes) {
            if (!fields[station] || !Object.keys(changes).every(key => fields[station].includes(key))) {
                throw new Error('This station cannot change those details.');
            }
            try {
                localStorage.setItem(storageKey(token), JSON.stringify({...load(token), ...changes}));
            } catch {
                throw new Error('Could not save your Viking. Check that local storage is enabled and try again.');
            }
        }
    };
})();

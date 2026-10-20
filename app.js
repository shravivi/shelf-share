const KEY = 'shelf-share-v1';
let items = JSON.parse(localStorage.getItem(KEY) || 'null') || [
  { id: 1, name: 'Extension ladder (24 ft)', category: 'Tools', owner: 'Maria, #12', who: '', due: '' },
  { id: 2, name: 'Folding tables (x3)', category: 'Other', owner: 'Dev, #8', who: '', due: '' },
];
const $ = s => document.querySelector(s);
const save = () => localStorage.setItem(KEY, JSON.stringify(items));
const today = () => new Date().toISOString().slice(0, 10);
const state = it => !it.who ? 'free' : it.due < today() ? 'late' : 'out';
let lendId = null;

function render() {
  const q = $('#q').value.toLowerCase(), f = $('#filter').value;
  const shown = items.filter(it => {
    const s = state(it);
    const match = [it.name, it.owner, it.who, it.category].join(' ').toLowerCase().includes(q);
    return match && (f === 'all' || (f === 'free' && s === 'free') || (f === 'out' && s !== 'free') || (f === 'late' && s === 'late'));
  });
  $('#count').textContent = `${shown.length} of ${items.length} items`;
  const ul = $('#list'); ul.replaceChildren();
  if (!shown.length) { const li = document.createElement('li'); li.textContent = 'Nothing matches. Add an item or clear the search.'; ul.append(li); }
  for (const it of shown) {
    const s = state(it), li = document.createElement('li'); li.className = s === 'free' ? '' : s;
    const info = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = it.name;
    const meta = document.createElement('small'); meta.textContent = `${it.category} · owned by ${it.owner}`;
    const st = document.createElement('small'); st.className = 'status'; st.style.display = 'block';
    st.textContent = s === 'free' ? 'Available' : `${s === 'late' ? 'Overdue: ' : 'With '}${it.who}${s === 'late' ? '' : ', due '}${s === 'late' ? ' (due ' + it.due + ')' : it.due}`;
    info.append(name, meta, st);
    const act = document.createElement('div');
    const b = document.createElement('button');
    b.textContent = s === 'free' ? 'Lend' : 'Mark returned';
    b.onclick = () => s === 'free' ? openLend(it) : (it.who = it.due = '', save(), render());
    const del = document.createElement('button'); del.textContent = 'Remove'; del.style.marginLeft = '6px';
    del.onclick = () => { if (confirm(`Remove "${it.name}" from the shelf?`)) { items = items.filter(x => x !== it); save(); render(); } };
    act.append(b, del); li.append(info, act); ul.append(li);
  }
}
function openLend(it) {
  lendId = it.id; $('#lendTitle').textContent = `Lend: ${it.name}`;
  const d = new Date(); d.setDate(d.getDate() + 7); $('#lendForm').due.value = d.toISOString().slice(0, 10);
  $('#lendForm').who.value = ''; $('#lend').showModal();
}
$('#lendForm').addEventListener('submit', e => {
  if (e.submitter.value !== 'ok') return;
  const it = items.find(x => x.id === lendId), f = e.target;
  it.who = f.who.value.trim(); it.due = f.due.value; save(); render();
});
$('#add').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  items.unshift({ id: Date.now(), name: f.name.value.trim(), category: f.category.value, owner: f.owner.value.trim(), who: '', due: '' });
  f.reset(); save(); render();
});
$('#q').oninput = $('#filter').onchange = render;
$('#export').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }));
  a.download = `shelf-share-${today()}.json`; a.click();
};
$('#import').onchange = async e => {
  try {
    const data = JSON.parse(await e.target.files[0].text());
    if (!Array.isArray(data)) throw 0;
    items = data.map(d => ({ id: d.id || Date.now() + Math.random(), name: String(d.name || ''), category: String(d.category || 'Other'), owner: String(d.owner || ''), who: String(d.who || ''), due: String(d.due || '') }));
    save(); render();
  } catch { alert('That file is not a valid Shelf Share backup.'); }
};
render();

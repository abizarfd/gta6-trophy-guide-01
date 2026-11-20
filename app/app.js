// GTA VI Trophy Guide & Tracker — checklist, filters, spoiler hiding, roadmap,
// export/import. All trophy data lives in data/trophies.json; this file only
// renders it and keeps the earned set in localStorage. No network use beyond
// the one same-folder fetch of data/trophies.json.
const STORE_KEY = 'gta6-trophy-tracker-v1';
const SPOILER_KEY = 'gta6-trophy-spoilers-v1';
const DEMO_EARNED = [2, 3, 15, 17, 35, 53]; // ids ticked by the #demo deep link

const STAGES = [
  {
    title: 'Play the story',
    text: 'Chapters 1 to 5 and the named story missions (Gone Fishing, Breakfast Run, The Cartel Heist, Child\u2019s Play, Headliners, VCIA Takedown, Operation Savage Glory), plus the character quest lines as they appear. Do not skip Lucia\u2019s balcony meditation in Chapter 1.',
  },
  {
    title: 'Activities, races and robberies',
    text: 'Stunts, races, Shooting Range golds, drone races, fishing and arcade games, partner robberies, combat tricks and the bank vaults. Most of these open up during the story and can be finished any time after.',
  },
  {
    title: 'Collectibles and the open world',
    text: 'Cards, WAiNK scans, vehicle discoveries, garage properties, meditation spots and exploring every corner of Leonida, plus the money trophies that fill up as you rob and spend.',
  },
  {
    title: '100% completion and the platinum',
    text: 'Open Progress > Stats > 100% Completion after the credits and work through what is left. When A Long Road pops, the platinum follows at once.',
  },
];

const listEl = document.getElementById('trophyList');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressBreakdown = document.getElementById('progressBreakdown');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const hideEarnedBox = document.getElementById('hideEarned');
const spoilersBox = document.getElementById('spoilers');
const spoilerNote = document.getElementById('spoilerNote');
const resultCount = document.getElementById('resultCount');
const emptyState = document.getElementById('emptyState');
const kindFilters = document.getElementById('kindFilters');

let trophies = [];
let listSourceName = '';
let listSourceUrl = '';
let earned = new Set(loadEarned());
let kind = 'all';

function loadEarned() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
}

function loadSpoilers() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

function saveSpoilers(on) {
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function isSpoilerHidden(t) {
  return spoilersBox.checked && t.kind === 'story' && !earned.has(t.name);
}

function trophyMatches(t) {
  if (kind !== 'all' && t.kind !== kind) return false;
  if (gradeSelect.value !== 'all' && t.grade !== gradeSelect.value) return false;
  if (hideEarnedBox.checked && earned.has(t.name)) return false;
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderRoadmap() {
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  STAGES.forEach((stage, index) => {
    const stageTrophies = trophies.filter((t) => t.stage === index + 1);
    const visible = [];
    let hiddenCount = 0;
    for (const t of stageTrophies) {
      if (spoilersBox.checked && t.kind === 'story' && !earned.has(t.name)) hiddenCount += 1;
      else visible.push(t.name);
    }
    let names = visible.join(' \u00b7 ');
    if (hiddenCount > 0) {
      names += (names ? ' \u00b7 ' : '') + `${hiddenCount} hidden story ${hiddenCount === 1 ? 'trophy' : 'trophies'} (tick earned to reveal)`;
    }
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    h3.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const list = document.createElement('p');
    list.className = 'stage-trophies';
    list.textContent = names;
    li.append(h3, p, list);
    stagesEl.append(li);
  });
}

function renderProgress() {
  const total = trophies.length;
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    if (earned.has(t.name)) counts[t.grade] = (counts[t.grade] ?? 0) + 1;
  }
  const done = counts.platinum + counts.gold + counts.silver + counts.bronze;
  progressFill.style.width = total ? `${(done / total) * 100}%` : '0%';
  progressText.textContent = `${done} of ${total} earned`;
  progressBreakdown.textContent =
    `${counts.platinum} platinum \u00b7 ${counts.gold} gold \u00b7 ${counts.silver} silver \u00b7 ${counts.bronze} bronze`;
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!trophyMatches(t)) continue;
    shown += 1;
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(t.name) ? ' earned' : '');
    li.id = `trophy-${t.id}`;

    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveEarned();
      renderProgress();
      renderList();
    });
    const titleWrap = document.createElement('div');
    titleWrap.className = 'trophy-title';
    const h3 = document.createElement('h3');
    if (isSpoilerHidden(t)) {
      h3.textContent = 'Hidden story trophy';
      h3.className = 'spoiler-hidden-name';
    } else {
      h3.textContent = t.name + (earned.has(t.name) ? ' \u2713' : '');
    }
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = isSpoilerHidden(t)
      ? 'A story trophy \u2014 tick it earned to reveal its name and description.'
      : t.description;
    titleWrap.append(h3, desc);
    const badge = document.createElement('span');
    badge.className = `grade-badge grade-${t.grade}`;
    badge.textContent = gradeLabel(t);
    head.append(box, titleWrap, badge);

    const tags = document.createElement('div');
    tags.className = 'tags';
    const kindTag = document.createElement('span');
    kindTag.className = 'tag kind-tag';
    kindTag.textContent = t.kind;
    tags.append(kindTag);
    if (t.hidden) {
      const hiddenTag = document.createElement('span');
      hiddenTag.className = 'tag hidden-tag';
      hiddenTag.textContent = 'Hidden on PSN';
      tags.append(hiddenTag);
    }
    if (t.missable) {
      const missTag = document.createElement('span');
      missTag.className = 'tag missable-tag';
      missTag.textContent = 'Possibly missable';
      tags.append(missTag);
    }
    if (t.count) {
      const countTag = document.createElement('span');
      countTag.className = 'tag';
      countTag.textContent = `PSN count: ${t.count}`;
      tags.append(countTag);
    }
    const stageTag = document.createElement('span');
    stageTag.className = 'tag';
    stageTag.textContent = `Roadmap stage ${t.stage}`;
    tags.append(stageTag);

    li.append(head, tags);

    if (!isSpoilerHidden(t)) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Guide & sources';
      const guide = document.createElement('p');
      guide.className = 'guide-text';
      guide.textContent = t.guide;
      const source = document.createElement('p');
      source.className = 'guide-source';
      source.textContent = 'Sources: ';
      const listLink = document.createElement('a');
      listLink.href = listSourceUrl;
      listLink.textContent = listSourceName;
      const guideLink = document.createElement('a');
      guideLink.href = t.source_url;
      guideLink.textContent = t.source;
      source.append(listLink, document.createTextNode(' (official list) \u00b7 '), guideLink, document.createTextNode(' (guide)'));
      details.append(summary, guide, source);
      li.append(details);
    }
    listEl.append(li);
  }
  emptyState.hidden = shown !== 0;
  resultCount.textContent = `Showing ${shown} of ${trophies.length} trophies.`;
}

function renderAll() {
  renderRoadmap();
  renderProgress();
  renderList();
}

function applyDeepLinks() {
  const hash = window.location.hash;
  if (hash.includes('spoilers=on')) {
    spoilersBox.checked = true;
    saveSpoilers(true);
  }
  if (hash.includes('demo')) {
    for (const id of DEMO_EARNED) {
      const t = trophies.find((x) => x.id === id);
      if (t) earned.add(t.name);
    }
    saveEarned();
  }
  const openMatch = hash.match(/open=(\d+)/);
  const viewMatch = hash.match(/view=(\w+)/);
  const kindMatch = hash.match(/kind=(\w+)/);
  if (kindMatch && ['story', 'missable', 'collectibles', 'activities', 'online'].includes(kindMatch[1])) {
    kind = kindMatch[1];
    for (const b of kindFilters.querySelectorAll('button')) {
      b.classList.toggle('active', b.dataset.kind === kind);
    }
  }
  renderAll();
  spoilerNote.hidden = !spoilersBox.checked;
  if (openMatch) {
    const el = document.getElementById(`trophy-${openMatch[1]}`);
    if (el) {
      const details = el.querySelector('details');
      if (details) details.open = true;
      el.scrollIntoView({ block: 'start' });
    }
  } else if (viewMatch && viewMatch[1] === 'roadmap') {
    document.getElementById('roadmap').scrollIntoView({ block: 'start' });
  } else if (viewMatch && viewMatch[1] === 'list') {
    document.querySelector('.controls').scrollIntoView({ block: 'start' });
  }
}

spoilersBox.checked = loadSpoilers();
spoilerNote.hidden = !spoilersBox.checked;
spoilersBox.addEventListener('change', () => {
  saveSpoilers(spoilersBox.checked);
  spoilerNote.hidden = !spoilersBox.checked;
  renderRoadmap();
  renderList();
});
searchInput.addEventListener('input', renderList);
gradeSelect.addEventListener('change', renderList);
hideEarnedBox.addEventListener('change', renderList);
kindFilters.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-kind]');
  if (!button) return;
  kind = button.dataset.kind;
  for (const b of kindFilters.querySelectorAll('button')) {
    b.classList.toggle('active', b === button);
  }
  renderList();
});

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    saveEarned();
    renderAll();
  } catch {
    resultCount.textContent = 'That file could not be imported: it is not a trophy-progress file from this guide.';
  }
  event.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  if (window.confirm('Clear all earned ticks?')) {
    earned = new Set();
    saveEarned();
    renderAll();
  }
});

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
listSourceName = doc.list_source ?? '';
listSourceUrl = doc.list_source_url ?? '';
applyDeepLinks();
window.addEventListener('hashchange', applyDeepLinks);

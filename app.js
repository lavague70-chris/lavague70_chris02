// 크리스의 여행노트 — data.json을 읽어서 화면을 그립니다.
// 주소 뒤 #europe 은 대륙 화면, #europe/west 처럼 / 뒤에 나라·지역 이름이 붙으면 하위 메뉴 화면입니다.

const app = document.getElementById('app');
let data = { categories: [], items: [] };

// 글자 안의 < > 등을 안전하게 바꿔줍니다
function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// 유튜브 링크면 썸네일 주소를 만들어줍니다
function youtubeThumb(link) {
  const m = String(link).match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
}

// 첫 화면: 대륙 카드 4개 + 하위 메뉴 바로가기
function renderHome() {
  document.title = '크리스의 여행노트';
  app.innerHTML = `<div class="cats">${data.categories.map(cat => {
    const count = data.items.filter(i => i.category === cat.id).length;
    const subs = cat.subs.map(s =>
      `<a class="chip" href="#${esc(cat.id)}/${esc(s.id)}">${esc(s.name)}</a>`).join('');
    return `
      <div class="cat" data-id="${esc(cat.id)}">
        <a class="cat-main" href="#${esc(cat.id)}">
          <div class="cat-emoji">${esc(cat.emoji)}</div>
          <div class="cat-text">
            <div class="cat-name">${esc(cat.name)}</div>
            <div class="cat-desc">${esc(cat.desc)}</div>
          </div>
          <div class="cat-count">${count}개</div>
        </a>
        <div class="chips">${subs}</div>
      </div>`;
  }).join('')}</div>`;
}

// 여행 기록 카드 1개
function renderItem(item, cat) {
  const img = item.image || youtubeThumb(item.link);
  const sub = cat.subs.find(s => s.id === item.sub);
  // 영상이 있으면 카드 안에서 바로 재생 (카드 전체를 링크로 만들지 않음)
  const tag = item.link && !item.video ? 'a' : 'div';
  const href = tag === 'a' ? ` href="${esc(item.link)}" target="_blank" rel="noopener"` : '';
  const media = item.video
    ? `<video src="${esc(item.video)}#t=0.1" controls playsinline preload="metadata"></video>`
    : img ? `<img src="${esc(img)}" alt="" loading="lazy">` : '';
  return `
    <${tag} class="item"${href}>
      ${media}
      <div class="item-body">
        ${sub ? `<span class="item-place">${esc(sub.name)}</span>` : ''}
        <h3 class="item-title">${esc(item.title)}</h3>
        ${item.memo ? `<p class="item-memo">${esc(item.memo)}</p>` : ''}
        <div class="item-meta">
          <span>${esc(item.date)}</span>
          ${item.link ? '<span class="item-link">보러 가기 →</span>' : ''}
        </div>
      </div>
    </${tag}>`;
}

// 대륙 화면: 위쪽 대륙 탭 + 하위 메뉴 + 여행 기록 목록 (최신순)
function renderCategory(cat, subId) {
  const sub = cat.subs.find(s => s.id === subId);
  document.title = `${sub ? sub.name : cat.name} · 크리스의 여행노트`;

  const items = data.items
    .filter(i => i.category === cat.id && (!sub || i.sub === sub.id))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const list = items.length
    ? items.map(item => renderItem(item, cat)).join('')
    : '<p class="empty">아직 올린 여행 기록이 없어요</p>';

  const tabs = data.categories.map(c => `
    <a class="tab${c.id === cat.id ? ' on' : ''}" data-id="${esc(c.id)}" href="#${esc(c.id)}">${esc(c.name)}</a>`
  ).join('');

  const subs = [{ id: '', name: '전체' }, ...cat.subs].map(s => `
    <a class="sub${s.id === (sub ? sub.id : '') ? ' on' : ''}" href="#${esc(cat.id)}${s.id ? '/' + esc(s.id) : ''}">${esc(s.name)}</a>`
  ).join('');

  app.innerHTML = `
    <a class="back" href="#">← 처음으로</a>
    <nav class="tabs">${tabs}</nav>
    <section class="section" data-id="${esc(cat.id)}">
      <div class="section-head">
        <h2>${esc(cat.emoji)} ${esc(cat.name)}${sub ? ` <small>› ${esc(sub.name)}</small>` : ''}</h2>
        <p>${esc(cat.desc)}</p>
      </div>
      ${cat.subs.length ? `<nav class="subs">${subs}</nav>` : ''}
      <div class="items">${list}</div>
    </section>`;
}

function route() {
  const [catId, subId] = decodeURIComponent(location.hash.slice(1)).split('/');
  const cat = data.categories.find(c => c.id === catId);
  cat ? renderCategory(cat, subId) : renderHome();
  window.scrollTo(0, 0);
}

fetch('data.json', { cache: 'no-cache' })
  .then(res => res.json())
  .then(json => { data = json; route(); })
  .catch(() => { app.innerHTML = '<p class="empty">자료를 불러오지 못했어요</p>'; });

window.addEventListener('hashchange', route);

// ---- 홈화면 설치 (PWA) ----

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// 안드로이드 크롬: 설치 버튼 보여주기
const installBtn = document.getElementById('installBtn');
let installEvent = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvent = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  installBtn.hidden = true;
});

// 기기에 맞는 설치 방법 안내
const ua = navigator.userAgent;
const howto = document.getElementById('howtoBody');
if (/KAKAOTALK/i.test(ua)) {
  const url = encodeURIComponent(location.href);
  howto.innerHTML = `
    <p>카톡 안에서는 설치가 안 돼요. 먼저 다른 브라우저로 열어주세요.</p>
    <a class="kakao-btn" href="kakaotalk://web/openExternal?url=${url}">브라우저로 열기</a>
    <p>열린 화면에서 아래 '홈화면에 추가'를 따라 하시면 됩니다.</p>`;
} else if (/iPhone|iPad|iPod/i.test(ua)) {
  howto.innerHTML = `
    <ol>
      <li>사파리 아래쪽 <b>공유 버튼(□↑)</b>을 누르세요</li>
      <li><b>홈 화면에 추가</b>를 누르세요</li>
      <li>오른쪽 위 <b>추가</b>를 누르면 끝!</li>
    </ol>`;
} else {
  howto.innerHTML = `
    <ol>
      <li>크롬 오른쪽 위 <b>⋮ 메뉴</b>를 누르세요</li>
      <li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 누르세요</li>
      <li><b>설치</b>를 누르면 홈화면에 아이콘이 생겨요</li>
    </ol>`;
}

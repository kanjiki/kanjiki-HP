(() => {
  const tools = Array.isArray(window.KANJIKI_TOOLS) ? window.KANJIKI_TOOLS : [];
  const updates = Array.isArray(window.KANJIKI_UPDATES) ? window.KANJIKI_UPDATES : [];
  const featured = tools.find(t => t.featured) || tools[0];
  const others = tools.filter(t => t !== featured);

  document.querySelectorAll('[data-tool-count]').forEach(el => {
    el.textContent = String(tools.length).padStart(2, '0');
  });

  const featuredRoot = document.querySelector('#featured-work');
  if (featuredRoot && featured) {
    const tags = (featured.tags || []).map(tag => `<span>${tag}</span>`).join('');
    featuredRoot.innerHTML = `
      <div class="featured-copy">
        <div class="featured-num">${featured.id}</div>
        <div class="featured-code">${featured.code}</div>
        <h2>${featured.title}</h2>
        <p>${featured.description}</p>
        <div class="featured-tags">${tags}</div>
        <a class="featured-link" href="${featured.url}" target="_blank" rel="noopener">${featured.action} <span>↗</span></a>
      </div>
      <a class="preview-frame" href="${featured.url}" target="_blank" rel="noopener" aria-label="${featured.title}を開く">
        <iframe src="${featured.url}" title="${featured.title} プレビュー" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
      </a>`;
  }

  const otherRoot = document.querySelector('#other-works');
  if (otherRoot) {
    otherRoot.innerHTML = others.map(tool => `
      <article class="work-row">
        <div class="work-row__num">${tool.id}</div>
        <div>
          <div class="work-row__code">${tool.code}</div>
          <h3>${tool.title}</h3>
          <p>${tool.description}</p>
          <a class="work-row__link" href="${tool.url}" target="_blank" rel="noopener">${tool.action} ↗</a>
        </div>
        <a class="thumb" href="${tool.url}" target="_blank" rel="noopener" aria-label="${tool.title}を開く">
          <iframe src="${tool.url}" title="${tool.title} プレビュー" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
        </a>
      </article>`).join('');
  }

  const updatesRoot = document.querySelector('#updates-list');
  if (updatesRoot) {
    updatesRoot.innerHTML = updates.map(update => `
      <div class="update-row">
        <time>${update.date}</time>
        <strong>${update.title}</strong>
        <span>${update.text}</span>
      </div>`).join('');
  }
})();

(() => {
  const tools = Array.isArray(window.KANJIKI_TOOLS) ? window.KANJIKI_TOOLS : [];
  const updates = Array.isArray(window.KANJIKI_UPDATES) ? window.KANJIKI_UPDATES : [];
  const featured = tools.find(t => t.featured) || tools[0];
  const others = tools.filter(t => t !== featured);

  const featuredRoot = document.querySelector('#featured-work');
  const otherRoot = document.querySelector('#other-works');
  const purposeRoot = document.querySelector('#purpose-list');
  const updatesRoot = document.querySelector('#updates-list');
  const countEls = document.querySelectorAll('[data-tool-count]');

  countEls.forEach(el => el.textContent = String(tools.length).padStart(2, '0'));

  const tags = tool => (tool.tags || []).map(tag => `<span>${tag}</span>`).join('');
  const facts = tool => (tool.facts || []).map(fact => `<li>${fact}</li>`).join('');

  if (purposeRoot) {
    purposeRoot.innerHTML = tools.map(tool => `
      <a class="purpose-item${tool.featured ? ' purpose-item--featured' : ''}" href="${tool.url}" target="_blank" rel="noopener">
        <span class="purpose-number">${tool.id}</span>
        <span class="purpose-copy">
          <strong>${tool.audience || tool.title}</strong>
          <small>${tool.title}</small>
        </span>
        <span class="purpose-arrow" aria-hidden="true">↗</span>
      </a>`).join('');
  }

  if (featuredRoot && featured) {
    featuredRoot.innerHTML = `
      <article class="featured-paper">
        <div class="featured-copy">
          <div class="featured-num">${featured.id}</div>
          <div class="featured-code">${featured.code}</div>
          <h2>${featured.title}</h2>
          <p>${featured.description}</p>
          <div class="tags">${tags(featured)}</div>
          <div class="audience"><b>こんな人向け</b><span>${featured.audience || ''}</span></div>
          <ul class="tool-facts">${facts(featured)}</ul>
          <a class="tool-link" href="${featured.url}" target="_blank" rel="noopener">${featured.action} <span>↗</span></a>
        </div>
        <a class="featured-preview" href="${featured.url}" target="_blank" rel="noopener" aria-label="${featured.title}を開く">
          <iframe src="${featured.url}" title="${featured.title} プレビュー" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
          <span class="preview-cover"></span>
        </a>
      </article>`;
  }

  if (otherRoot) {
    otherRoot.innerHTML = others.map(tool => `
      <article class="work-row">
        <div class="work-row__num">${tool.id}</div>
        <div class="work-row__copy">
          <div class="work-row__code">${tool.code}</div>
          <h3>${tool.title}</h3>
          <p>${tool.description}</p>
          <div class="tags">${tags(tool)}</div>
          <div class="audience audience--compact"><b>こんな人向け</b><span>${tool.audience || ''}</span></div>
          <details class="tool-details">
            <summary>特徴を見る</summary>
            <ul class="tool-facts">${facts(tool)}</ul>
          </details>
          <a class="tool-link" href="${tool.url}" target="_blank" rel="noopener">${tool.action} <span>↗</span></a>
        </div>
        <a class="row-preview" href="${tool.url}" target="_blank" rel="noopener" aria-label="${tool.title}を開く">
          <iframe src="${tool.url}" title="${tool.title} プレビュー" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
          <span class="preview-cover"></span>
        </a>
      </article>`).join('');
  }

  if (updatesRoot) {
    updatesRoot.innerHTML = updates.map(update => `
      <div class="update-row">
        <time>${update.date}</time>
        <strong>${update.title}</strong>
        <span>${update.text}</span>
      </div>`).join('');
  }
})();

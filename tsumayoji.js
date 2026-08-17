(() => {
  const tools = Array.isArray(window.KANJIKI_TOOLS) ? window.KANJIKI_TOOLS : [];
  const inProgress = Array.isArray(window.KANJIKI_IN_PROGRESS) ? window.KANJIKI_IN_PROGRESS : [];
  const updates = Array.isArray(window.KANJIKI_UPDATES) ? window.KANJIKI_UPDATES : [];
  const root = document.querySelector('#works-grid');
  const progressRoot = document.querySelector('#developing-grid');
  const count = document.querySelector('[data-tool-count]');
  const progressCount = document.querySelector('[data-progress-count]');
  const updatesRoot = document.querySelector('#updates-list');
  const tags = tool => (tool.tags || []).map(tag => `<span>${tag}</span>`).join('');

  if (count) count.textContent = String(tools.length).padStart(2, '0');
  if (progressCount) progressCount.textContent = String(inProgress.length).padStart(2, '0');

  if (root) {
    root.innerHTML = tools.map(tool => `
      <article class="tool-card${tool.featured ? ' tool-card--featured' : ''}">
        <div class="card-head">
          <span class="card-num">${tool.id}</span>
          ${tool.featured ? '<span class="featured-pill">FEATURED</span>' : ''}
        </div>
        <div class="card-copy">
          <div class="card-code">${tool.code}</div>
          <h3>${tool.title}</h3>
          <p>${tool.description}</p>
          <div class="tags">${tags(tool)}</div>
        </div>
        <a class="card-preview" href="${tool.url}" target="_blank" rel="noopener" aria-label="${tool.title}を開く">
          <iframe src="${tool.url}" title="${tool.title} プレビュー" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
          <span class="preview-cover"></span>
        </a>
        <div class="card-foot">
          <a class="card-link" href="${tool.url}" target="_blank" rel="noopener">${tool.action}</a>
          <span class="card-arrow">↗</span>
        </div>
      </article>`).join('');
  }

  if (progressRoot) {
    progressRoot.innerHTML = inProgress.map((tool, index) => `
      <article class="progress-card">
        <div class="progress-card__top">
          <span class="progress-card__num">${String(index + 1).padStart(2, '0')}</span>
          <span class="progress-status">${tool.status}</span>
        </div>
        <div class="progress-code">${tool.code}</div>
        <h3>${tool.title}</h3>
        <p>${tool.description}</p>
        <div class="tags">${tags(tool)}</div>
      </article>`).join('');
  }

  if (updatesRoot) {
    updatesRoot.innerHTML = updates.map(update => `
      <div class="update-row"><time>${update.date}</time><strong>${update.title}</strong><span>${update.text}</span></div>`).join('');
  }
})();

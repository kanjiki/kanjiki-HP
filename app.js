(() => {
  const tools = Array.isArray(window.KANJIKI_TOOLS) ? window.KANJIKI_TOOLS : [];
  const updates = Array.isArray(window.KANJIKI_UPDATES) ? window.KANJIKI_UPDATES : [];

  const list = document.querySelector('#tool-list');
  const counters = document.querySelectorAll('[data-tool-count]');
  const updatesList = document.querySelector('#updates-list');

  counters.forEach((count) => {
    count.textContent = String(tools.length).padStart(2, '0');
  });

  if (list) {
    list.innerHTML = tools.map((tool) => {
      const tags = tool.tags.map(tag => `<span>${tag}</span>`).join('');
      const featured = tool.featured ? ' work-card--featured' : '';
      const badge = tool.featured ? '<span class="featured-badge">FEATURED</span>' : '';
      return `
        <article class="work-card${featured}">
          <div class="work-card__head">
            <span class="work-card__number">${tool.id}</span>
            ${badge}
          </div>
          <div class="work-card__copy">
            <p class="work-card__code">${tool.code}</p>
            <h3>${tool.title}</h3>
            <p class="work-card__description">${tool.description}</p>
            <div class="work-card__tags">${tags}</div>
          </div>
          <a class="work-card__preview" href="${tool.url}" target="_blank" rel="noopener" aria-label="${tool.title}を開く">
            <div class="preview-stage">
              <iframe src="${tool.url}" title="${tool.title} プレビュー" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
              <span class="preview-shield"></span>
            </div>
          </a>
          <a class="work-card__link" href="${tool.url}" target="_blank" rel="noopener">${tool.action} <span>↗</span></a>
        </article>`;
    }).join('');
  }

  if (updatesList) {
    updatesList.innerHTML = updates.map(update => `
      <div class="update-row">
        <time>${update.date}</time>
        <strong>${update.title}</strong>
        <span>${update.text}</span>
      </div>`).join('');
  }
})();
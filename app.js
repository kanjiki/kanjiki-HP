(() => {
  const tools = Array.isArray(window.KANJIKI_TOOLS) ? window.KANJIKI_TOOLS : [];
  const updates = Array.isArray(window.KANJIKI_UPDATES) ? window.KANJIKI_UPDATES : [];

  const list = document.querySelector('#tool-list');
  const count = document.querySelector('[data-tool-count]');
  const updatesList = document.querySelector('#updates-list');

  if (count) count.textContent = String(tools.length).padStart(2, '0');

  if (list) {
    list.innerHTML = tools.map((tool, index) => {
      const reverse = index % 2 === 1 ? ' project--reverse' : '';
      const tags = tool.tags.map(tag => `<span>${tag}</span>`).join('');
      return `
        <article class="project${reverse}" data-tone="${tool.tone}">
          <div class="project__info">
            <div class="project__meta">
              <span class="project__number">${tool.id}</span>
              <span class="project__code">${tool.code}</span>
            </div>
            <h2>${tool.title}</h2>
            <p>${tool.description}</p>
            <div class="project__tags">${tags}</div>
            <a class="project__link" href="${tool.url}" target="_blank" rel="noopener">
              ${tool.action}<span aria-hidden="true">↗</span>
            </a>
          </div>
          <a class="project__preview" href="${tool.url}" target="_blank" rel="noopener" aria-label="${tool.title}を開く">
            <div class="browser-bar">
              <span></span><span></span><span></span>
              <small>${new URL(tool.url).pathname}</small>
            </div>
            <div class="preview-stage">
              <iframe src="${tool.url}" title="${tool.title} プレビュー" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
              <div class="preview-shield"></div>
            </div>
          </a>
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
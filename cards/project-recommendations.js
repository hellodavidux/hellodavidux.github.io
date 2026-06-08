/**
 * Renders the next two projects from the landing page order.
 */
(function () {
  const RECOMMENDATION_COUNT = 2;

  const LANDING_PROJECTS = [
    {
      file: 'agentic-lifecycle.html',
      title: 'AGENTIC DEVELOPMENT LIFECYCLE',
      previewTitle: 'Agentic Development Lifecycle preview',
      media: { type: 'video', src: 'images/agentic-lifecycle/thumbnail.mp4' },
    },
    {
      file: 'new-project.html',
      title: 'PROMPT TO FLOW',
      previewTitle: 'Prompt to Flow preview',
      media: { type: 'video', src: 'images/prompt-to-flow/mboile.mp4' },
    },
    {
      file: 'organization-agent-library.html',
      title: 'ORGANIZATION AGENT LIBRARY',
      previewTitle: 'Organization Agent Library preview',
      media: { type: 'video', src: 'images/organization-agent-library/thumbnail_mobile.mp4' },
    },
    {
      file: 'agent-evaluator.html',
      title: 'WORKFLOW ANALYTICS AND AGENT EVALUATOR',
      previewTitle: 'Workflow Analytics and Agent Evaluator preview',
      media: { type: 'video', src: 'images/agent-evaluator/main-thumbnail.mp4' },
    },
    {
      file: 'project1.html',
      title: 'HOLISTIC TRAINING BUILDER REDESIGN',
      previewTitle: 'Holistic Training Builder Redesign preview',
      media: { type: 'video', src: 'images/project_1/cover.mp4' },
    },
    {
      file: 'project2.html',
      title: 'SPORTS MEDIA CONCEPTS FOR GEN Z',
      previewTitle: 'Sports Media Concepts for Gen Z preview',
      media: { type: 'video', src: 'images/project_2/thumbnail.mp4' },
    },
  ];

  function getCurrentFile() {
    const segments = (window.location.pathname || '').split('/').filter(Boolean);
    const file = segments[segments.length - 1] || '';
    return file.endsWith('.html') ? file : '';
  }

  function getCurrentIndex(file) {
    const index = LANDING_PROJECTS.findIndex((project) => project.file === file);
    if (index !== -1) {
      return index;
    }

    if (file === 'project3.html') {
      return LANDING_PROJECTS.length - 1;
    }

    return -1;
  }

  function getRecommendations(file) {
    const currentIndex = getCurrentIndex(file);
    if (currentIndex === -1) {
      return [];
    }

    const recommendations = [];
    for (let offset = 1; offset <= RECOMMENDATION_COUNT; offset += 1) {
      recommendations.push(
        LANDING_PROJECTS[(currentIndex + offset) % LANDING_PROJECTS.length]
      );
    }

    return recommendations;
  }

  function renderThumbnail(project) {
    if (project.media.type === 'video') {
      return `
        <video autoplay loop muted playsinline title="${project.previewTitle}">
          <source src="${project.media.src}" type="video/mp4">
        </video>
      `;
    }

    return `
      <img
        src="${project.media.src}"
        alt=""
        loading="lazy"
        decoding="async"
      >
    `;
  }

  function renderCard(project, index) {
    const cardClass = index === 0 ? 'left-card' : 'right-card';

    return `
      <article class="next-project-card hoverable ${cardClass}">
        <a href="${project.file}" class="next-project-card__link" aria-label="${project.previewTitle}">
          <div class="next-project-card__thumb">
            ${renderThumbnail(project)}
          </div>
          <h4 class="next-project-card__title">${project.title}</h4>
        </a>
      </article>
    `;
  }

  function renderRecommendations() {
    const container = document.getElementById('next-project-cards');
    if (!container) {
      return;
    }

    const recommendations = getRecommendations(getCurrentFile());
    container.innerHTML = recommendations.map(renderCard).join('');
    container.setAttribute('data-loaded', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderRecommendations);
  } else {
    renderRecommendations();
  }
})();

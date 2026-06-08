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
    const path = window.location.pathname || '';
    const file = path.split('/').pop();
    return file || '';
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
        <video class="w-full h-full object-cover" autoplay loop muted playsinline title="${project.previewTitle}">
          <source src="${project.media.src}" type="video/mp4">
        </video>
      `;
    }

    return `
      <img
        class="w-full h-full object-cover"
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
      <div class="w-full min-w-0 hoverable ${cardClass} p-4 md:p-8 bg-white rounded-lg shadow-[0px_0px_2px_0px_rgba(0,0,0,0.12)] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.14)] transition-all duration-300 hover:shadow-lg">
        <a href="${project.file}" class="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 md:gap-8 w-full min-w-0">
          <div class="w-full sm:w-40 h-28 shrink-0 rounded-lg shadow-[0px_0px_1.5px_0px_rgba(255,255,255,0.12)] shadow-[0px_6px_12px_0px_rgba(0,0,0,0.14)] overflow-hidden">
            <div class="w-full h-full overflow-hidden">
              ${renderThumbnail(project)}
            </div>
          </div>
          <div class="min-w-0 w-full sm:flex-1 text-zinc-950 text-2xl font-black">${project.title}</div>
        </a>
      </div>
    `;
  }

  function renderRecommendations() {
    const container = document.getElementById('next-project-cards');
    if (!container) {
      return;
    }

    const recommendations = getRecommendations(getCurrentFile());
    container.innerHTML = recommendations.map(renderCard).join('');
  }

  document.addEventListener('DOMContentLoaded', renderRecommendations);
})();

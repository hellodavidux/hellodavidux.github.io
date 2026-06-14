/**
 * Prev/next project navigation for card pages.
 */
(function () {
  'use strict';

  const PROJECT_NAV = [
    {
      file: 'organization-agent-library.html',
      ariaLabel: 'Organization Agent Library preview',
      video: 'images/organization-agent-library/thumbnail_mobile.mp4',
      title: 'Redesigning the Agent Library to increase agent usage in the org.',
    },
    {
      file: 'new-project.html',
      ariaLabel: 'Prompt to Flow preview',
      video: 'images/prompt-to-flow/mboile.mp4',
      title: 'Redesigning how to start new AI workflows.',
    },
    {
      file: 'agentic-lifecycle.html',
      ariaLabel: 'Agentic Development Lifecycle preview',
      video: 'images/agentic-lifecycle/thumbnail.mp4',
      title: 'Governing AI deployments with approvals and rollback.',
    },
    {
      file: 'agent-evaluator.html',
      ariaLabel: 'Workflow Analytics and Agent Evaluator preview',
      video: 'images/agent-evaluator/main-thumbnail.mp4',
      title: 'Auditability and evaluation of agentic workflows.',
    },
    {
      file: 'project1.html',
      ariaLabel: 'Holistic Training Builder Redesign preview',
      video: 'images/project_1/cover.mp4',
      title: 'Faster, flexible workout planning for coaches.',
    },
    {
      file: 'project2.html',
      ariaLabel: 'Follow football player performances preview',
      video: 'images/project_2/thumbnail.mp4',
      title: 'Follow football player performances.',
    },
    {
      file: 'project3.html',
      ariaLabel: 'Easy Semester preview',
      video: 'images/project_3/easy-thumbnail.mp4',
      title: 'Circular rental service for exchange students.',
    },
  ];

  function buildNextProjectCard(project, direction) {
    const isPrevious = direction === 'previous';
    const card = document.createElement('article');
    card.className = `next-project-card hoverable ${isPrevious ? 'next-project-card--prev left-card' : 'next-project-card--next right-card'}`;

    const directionLabel = isPrevious ? 'Previous' : 'Next';
    const arrowIcon = isPrevious
      ? '<i class="fas fa-chevron-left" aria-hidden="true"></i>'
      : '<i class="fas fa-chevron-right" aria-hidden="true"></i>';
    const directionMarkup = isPrevious
      ? `<p class="next-project-card__direction">${arrowIcon}<span>${directionLabel}</span></p>`
      : `<p class="next-project-card__direction"><span>${directionLabel}</span>${arrowIcon}</p>`;

    card.innerHTML = `
      <a href="${project.file}" class="next-project-card__link" aria-label="${project.ariaLabel}">
        <div class="next-project-card__body">
          <div class="next-project-card__thumb">
            <video autoplay loop muted playsinline title="${project.ariaLabel}">
              <source src="${project.video}" type="video/mp4">
            </video>
          </div>
          <div class="next-project-card__copy">
            ${directionMarkup}
            <h4 class="next-project-card__title">${project.title}</h4>
          </div>
        </div>
      </a>
    `;

    return card;
  }

  function getCurrentProjectFile() {
    const section = document.getElementById('next-project');
    if (section?.dataset.currentProject) {
      return section.dataset.currentProject;
    }

    const pathname = window.location.pathname.split('/').pop();
    if (pathname && pathname.endsWith('.html')) {
      return pathname;
    }

    return '';
  }

  function initNextProjectNav() {
    const container = document.getElementById('next-project-cards');
    if (!container) {
      return;
    }

    const currentFile = getCurrentProjectFile();
    const currentIndex = PROJECT_NAV.findIndex((project) => project.file === currentFile);
    if (currentIndex < 0) {
      return;
    }

    const previousProject = currentIndex > 0 ? PROJECT_NAV[currentIndex - 1] : null;
    const nextProject = PROJECT_NAV[(currentIndex + 1) % PROJECT_NAV.length];

    container.replaceChildren();

    if (previousProject) {
      container.appendChild(buildNextProjectCard(previousProject, 'previous'));
    }

    container.appendChild(buildNextProjectCard(nextProject, 'next'));

    if (!previousProject) {
      container.classList.add('next-project-cards--next-only');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNextProjectNav);
  } else {
    initNextProjectNav();
  }
})();

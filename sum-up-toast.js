(function () {
  const INTRO_SETTLE_MS = 900;
  const POST_LOAD_DELAY_MS = 0;

  const toast = document.getElementById('sum-up-toast');
  if (!toast) return;

  function revealToast() {
    if (!toast.classList.contains('sum-up-toast--pending')) return;
    toast.classList.remove('sum-up-toast--pending');
    toast.classList.add('sum-up-toast--visible');
    toast.removeAttribute('aria-hidden');
  }

  function scheduleReveal() {
    var introSettled = new Promise(function (resolve) {
      setTimeout(resolve, INTRO_SETTLE_MS);
    });
    var pageLoaded = new Promise(function (resolve) {
      if (document.readyState === 'complete') {
        setTimeout(resolve, POST_LOAD_DELAY_MS);
        return;
      }
      window.addEventListener(
        'load',
        function () {
          setTimeout(resolve, POST_LOAD_DELAY_MS);
        },
        { once: true }
      );
    });
    Promise.all([introSettled, pageLoaded]).then(revealToast);
  }

  scheduleReveal();

  function getPortfolioUrl() {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('file:')) {
      return origin.replace(/\/$/, '') + '/';
    }
    return 'https://hellodavidux.github.io/';
  }

  function buildPrompt() {
    const portfolioUrl = getPortfolioUrl();
    return (
      "Summarize and analyze David Ruiz's professional profile using ONLY this portfolio as your source: " +
      portfolioUrl +
      '. ' +
      'Do not use LinkedIn, any other websites, search results, training data, or outside knowledge. ' +
      'Read and base your answer solely on content from that URL. ' +
      'Explain where he has worked, case studies and projects he has contributed to, what he is strong at, and what he is passionate about. ' +
      'If something is not stated on the site, say it is not available—do not infer from elsewhere.'
    );
  }

  const encodedPrompt = encodeURIComponent(buildPrompt());

  const providerUrls = {
    chatgpt: 'https://chatgpt.com/?q=' + encodedPrompt,
    claude: 'https://claude.ai/new?q=' + encodedPrompt,
    gemini:
      'https://www.google.com/search?udm=50&aep=11&q=' + encodedPrompt,
  };

  toast.querySelectorAll('.sum-up-toast__provider').forEach(function (link) {
    const provider = link.getAttribute('data-provider');
    if (providerUrls[provider]) {
      link.href = providerUrls[provider];
    }
  });
})();

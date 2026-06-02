(function () {
  const SUM_UP_ENABLED = true;

  const INTRO_SETTLE_MS = 900;
  const POST_LOAD_DELAY_MS = 0;

  const toast = document.getElementById('sum-up-toast');
  if (!toast) return;

  if (!SUM_UP_ENABLED) {
    toast.setAttribute('hidden', '');
    return;
  }

  function revealToast() {
    if (!toast.classList.contains('sum-up-toast--pending')) return;
    toast.removeAttribute('hidden');
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

  function buildPrompt() {
    return (
      'Please summarize David Ruiz’s profile based only on content from:\n\n' +
      'https://heydavid.work/llms.txt\n' +
      'https://heydavid.work\n\n' +
      'Keep it concise and professional. Include:\n\n' +
      'A 2-3 sentence professional summary\n' +
      'Core strengths (bullet points)\n' +
      'Notable projects and outcomes (bullet points)\n' +
      'Industries/domains of experience\n' +
      'Suggested roles David is a strong fit for\n' +
      'Do not use outside sources. If any information is missing, write: "Not available on provided sources."'
    );
  }

  const prompt = buildPrompt();
  const encodedPrompt = encodeURIComponent(prompt);

  const providerUrls = {
    perplexity: 'https://www.perplexity.ai/?q=' + encodedPrompt,
    chatdk: 'https://chat.dk/?q=' + encodedPrompt,
    claude: 'https://claude.ai/new?q=' + encodedPrompt,
  };

  toast.querySelectorAll('.sum-up-toast__provider').forEach(function (link) {
    const provider = link.getAttribute('data-provider');
    if (providerUrls[provider]) {
      link.href = providerUrls[provider];
    }
  });

  const chatDkLink = toast.querySelector('.sum-up-toast__provider[data-provider="chatdk"]');
  if (chatDkLink) {
    chatDkLink.addEventListener('click', function () {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard
        .writeText(prompt)
        .then(function () {
          chatDkLink.setAttribute(
            'data-tooltip',
            'Prompt copied. Paste in chat.dk'
          );
        })
        .catch(function () {
          // Ignore clipboard failures to avoid blocking navigation.
        });
    });
  }
})();

(function () {
  const SUM_UP_ENABLED = true;

  const toast = document.getElementById('sum-up-toast');
  if (!toast) return;

  if (!SUM_UP_ENABLED) {
    toast.setAttribute('hidden', '');
    return;
  }

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

  toast.href = 'https://chat.dk/?q=' + encodeURIComponent(buildPrompt());
})();

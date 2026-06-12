// Logo name color on card pages (homepage syncs via main.js updateNavbarLinks)
document.addEventListener('DOMContentLoaded', function () {
    const logoName = document.getElementById('logo-name');
    if (!logoName) return;

    function updateLogoNameColor() {
        if (document.getElementById('fullpage')) {
            return;
        }

        logoName.classList.remove('logo-name-dark');
        logoName.classList.add('logo-name-light');
    }

    updateLogoNameColor();
});

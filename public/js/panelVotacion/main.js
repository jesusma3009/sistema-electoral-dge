document.addEventListener("DOMContentLoaded", function () {
    var dataElem = document.querySelector('.js-data');
    if (!dataElem) return;
    window.panelVotacionContext = {
        domain: dataElem.getAttribute('data-domain'),
        votacionId: dataElem.getAttribute('data-votacion-id')
    };

    if (window.PanelTabs && typeof PanelTabs.init === 'function') {
        PanelTabs.init();
    }
    if (window.PanelCandidates && typeof PanelCandidates.init === 'function') {
        PanelCandidates.init();
    }
    if (window.PanelConfig && typeof PanelConfig.init === 'function') {
        PanelConfig.init();
    }
    if (window.PanelCenso && typeof PanelCenso.init === 'function') {
        PanelCenso.init();
    }
});
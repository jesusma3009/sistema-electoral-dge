(function () {
    var PanelTabs = {
        init: function () {
            var tabs = document.querySelectorAll('.menu ul li');
            var panels = document.querySelectorAll('.panel-panel');
            tabs.forEach(function (tab) {
                tab.addEventListener('click', function () {
                    tabs.forEach(function (t) { t.classList.remove('active'); });
                    panels.forEach(function (panel) { panel.classList.remove('active'); });
                    this.classList.add('active');
                    var tabId = this.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                });
            });
        }
    };

    window.PanelTabs = PanelTabs;
})();
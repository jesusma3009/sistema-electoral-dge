(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var previewTab = document.querySelector('li[data-tab="vista-previa"]');
        if (previewTab) {
            previewTab.addEventListener('click', function () {
                loadPreview();
            });
        }

        function loadPreview() {
            // Se obtiene el id de votación desde panelVotacionContext y se pasa en la URL.
            var apiUrl = panelVotacionContext.domain + '/admin/votacion/vista-previa/datos?votacion_id=' + panelVotacionContext.votacionId;
            fetch(apiUrl)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Error al obtener los datos de vista previa");
                    }
                    return response.json();
                })
                .then(function (data) {
                    renderBallot(data);
                })
                .catch(function (error) {
                    console.error("Error:", error);
                });
        }

        function renderBallot(data) {
            var ballotContainer = document.getElementById('ballotContainer');
            if (!ballotContainer) return;
            ballotContainer.innerHTML = "";

            var ballot = document.createElement('div');
            ballot.className = 'ballot';

            var heading = document.createElement('h3');
            heading.textContent = "Papeleta de Votación (Vista Previa)";
            ballot.appendChild(heading);

            var form = document.createElement('form');

            data.candidatos.sort(function (a, b) { return a.orden - b.orden; });
            data.candidatos.forEach(function (candidate) {
                var optionDiv = document.createElement('div');
                optionDiv.className = 'ballot-option';

                var radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'ballotOption';
                radio.value = candidate.id;
                radio.id = 'candidate_' + candidate.id;

                var label = document.createElement('label');
                label.setAttribute('for', radio.id);
                label.textContent = candidate.nombre;

                optionDiv.appendChild(radio);
                optionDiv.appendChild(label);
                form.appendChild(optionDiv);
            });

            if (data.votacion.votoBlanco) {
                var blancoDiv = document.createElement('div');
                blancoDiv.className = 'ballot-option';

                var radioBlanco = document.createElement('input');
                radioBlanco.type = 'radio';
                radioBlanco.name = 'ballotOption';
                radioBlanco.value = 'blanco';
                radioBlanco.id = 'voto_blanco';

                var labelBlanco = document.createElement('label');
                labelBlanco.setAttribute('for', 'voto_blanco');
                labelBlanco.textContent = 'Voto en Blanco';

                blancoDiv.appendChild(radioBlanco);
                blancoDiv.appendChild(labelBlanco);
                form.appendChild(blancoDiv);
            }

            if (data.votacion.votoNulo) {
                var nuloDiv = document.createElement('div');
                nuloDiv.className = 'ballot-option';

                var radioNulo = document.createElement('input');
                radioNulo.type = 'radio';
                radioNulo.name = 'ballotOption';
                radioNulo.value = 'nulo';
                radioNulo.id = 'voto_nulo';

                var labelNulo = document.createElement('label');
                labelNulo.setAttribute('for', 'voto_nulo');
                labelNulo.textContent = 'Voto Nulo';

                nuloDiv.appendChild(radioNulo);
                nuloDiv.appendChild(labelNulo);

                var nuloText = document.createElement('input');
                nuloText.type = 'text';
                nuloText.className = 'nulo-extra';
                nuloText.placeholder = 'Escribe un mensaje...';
                nuloText.disabled = true;

                radioNulo.addEventListener('change', function () {
                    if (this.checked) {
                        nuloText.disabled = false;
                    }
                });

                form.addEventListener('change', function (e) {
                    if (e.target.name === 'ballotOption' && e.target.value !== 'nulo') {
                        nuloText.disabled = true;
                        nuloText.value = "";
                    }
                });

                nuloDiv.appendChild(nuloText);
                form.appendChild(nuloDiv);
            }

            ballot.appendChild(form);
            ballotContainer.appendChild(ballot);
        }
    });
})();
(function () {
    var PanelCandidates = {
        init: function () {
            if (!window.panelVotacionContext) return;
            var domain = window.panelVotacionContext.domain;
            var votacionId = window.panelVotacionContext.votacionId;
            var candidateList = document.querySelector('.candidates-checklist ul');
            if (!candidateList) return;

            // Función para actualizar el orden de los candidatos
            function updateCandidatesOrder() {
                var candidateItems = candidateList.querySelectorAll('li');
                candidateItems.forEach(function (item, index) {
                    var candidateId = item.getAttribute('data-candidate-id');
                    var candidateName = item.querySelector('.candidate-name').innerText.trim();
                    if (!candidateName) candidateName = "Sin nombre";
                    if (!candidateId.startsWith("new_")) {
                        fetch(domain + '/admin/votacion/candidatos/editar/' + candidateId, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nombre: candidateName, orden: index + 1 })
                        })
                            .then(function (response) { return response.json(); })
                            .then(function (data) {
                                if (!data.success) {
                                    console.error("Error actualizando el orden para el candidato " + candidateId);
                                }
                            })
                            .catch(function (err) { console.error(err); });
                    }
                });
            }

            // Configurar Drag & Drop para los candidatos
            var dragSrcEl = null;
            function handleDragStart(e) {
                dragSrcEl = this;
                e.dataTransfer.effectAllowed = 'move';
            }
            function handleDragOver(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                return false;
            }
            function handleDragEnter(e) {
                this.classList.add('over');
            }
            function handleDragLeave(e) {
                this.classList.remove('over');
            }
            function handleDrop(e) {
                e.stopPropagation();
                if (dragSrcEl !== this) {
                    var parent = this.parentNode;
                    parent.insertBefore(dragSrcEl, this);
                    updateCandidatesOrder();
                }
                return false;
            }
            function handleDragEnd(e) {
                candidateList.querySelectorAll('li').forEach(function (item) {
                    item.classList.remove('over');
                });
            }

            // Inicializar eventos de drag & drop en cada candidato ya existente
            var candidateItems = candidateList.querySelectorAll('li');
            candidateItems.forEach(function (item) {
                item.setAttribute('draggable', 'true');
                item.addEventListener('dragstart', handleDragStart, false);
                item.addEventListener('dragenter', handleDragEnter, false);
                item.addEventListener('dragover', handleDragOver, false);
                item.addEventListener('dragleave', handleDragLeave, false);
                item.addEventListener('drop', handleDrop, false);
                item.addEventListener('dragend', handleDragEnd, false);
            });

            // Función para agregar un candidato en línea
            var addCandidateButton = document.getElementById("addCandidateButton");
            if (addCandidateButton) {
                addCandidateButton.addEventListener("click", function () {
                    var newCandidateId = 'new_' + Date.now();
                    var li = document.createElement('li');
                    li.setAttribute('data-candidate-id', newCandidateId);
                    li.setAttribute('draggable', 'true');

                    var handle = document.createElement('span');
                    handle.className = 'candidate-handle';
                    handle.title = 'Arrastra para reordenar';
                    handle.innerHTML = '&#9776;';
                    li.appendChild(handle);

                    var span = document.createElement('span');
                    span.className = 'candidate-name';
                    span.contentEditable = "true";
                    span.setAttribute('data-candidate-id', newCandidateId);
                    span.innerText = "Nuevo candidato";
                    li.appendChild(span);

                    var removeButton = document.createElement('div');
                    removeButton.className = 'removeCandidate';
                    removeButton.setAttribute('data-candidate-id', newCandidateId);
                    removeButton.title = 'Eliminar candidato';
                    removeButton.innerText = '🗑️';
                    li.appendChild(removeButton);

                    candidateList.appendChild(li);

                    // Agregar los manejadores de eventos de drag & drop al nuevo elemento
                    li.addEventListener('dragstart', handleDragStart, false);
                    li.addEventListener('dragenter', handleDragEnter, false);
                    li.addEventListener('dragover', handleDragOver, false);
                    li.addEventListener('dragleave', handleDragLeave, false);
                    li.addEventListener('drop', handleDrop, false);
                    li.addEventListener('dragend', handleDragEnd, false);

                    // Cuando se termine la edición en el nombre del candidato: agregar o actualizar
                    span.addEventListener('blur', function () {
                        var candidateId = this.getAttribute('data-candidate-id');
                        var newName = this.innerText.trim();
                        if (!newName) return;
                        var liParent = this.closest('li');
                        var newOrder = Array.from(candidateList.children).indexOf(liParent) + 1;
                        if (candidateId.startsWith("new_")) {
                            fetch(domain + '/admin/votacion/candidatos/agregar', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ votacion_id: votacionId, nombre: newName, orden: newOrder })
                            })
                                .then(function (response) { return response.json(); })
                                .then(function (data) {
                                    if (data.success) {
                                        // Actualizar los atributos con el ID real
                                        span.setAttribute('data-candidate-id', data.candidato_id);
                                        li.setAttribute('data-candidate-id', data.candidato_id);
                                        removeButton.setAttribute('data-candidate-id', data.candidato_id);
                                    } else {
                                        throw new Error("Error al agregar candidato");
                                    }
                                })
                                .catch(function (err) { console.error(err); });
                        } else {
                            fetch(domain + '/admin/votacion/candidatos/editar/' + candidateId, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ nombre: newName, orden: newOrder })
                            })
                                .then(function (response) { return response.json(); })
                                .then(function (data) { console.log("Candidato actualizado."); })
                                .catch(function (err) { console.error("Error al actualizar candidato.", err); });
                        }
                    });

                    // Manejar la eliminación del candidato agregado
                    removeButton.addEventListener("click", function (e) {
                        e.stopPropagation();
                        if (confirm("¿Está seguro de eliminar este candidato?")) {
                            var candidateId = this.getAttribute('data-candidate-id');
                            if (!candidateId.startsWith("new_")) {
                                fetch(domain + '/admin/votacion/candidatos/eliminar/' + candidateId, {
                                    method: 'POST'
                                })
                                    .then(function (response) { return response.json(); })
                                    .then(function (data) {
                                        if (data.success) {
                                            li.parentElement.removeChild(li);
                                            updateCandidatesOrder();
                                        } else {
                                            alert("Error al eliminar candidato.");
                                        }
                                    })
                                    .catch(function (err) {
                                        console.error(err);
                                        alert("Error al eliminar candidato.");
                                    });
                            } else {
                                li.parentElement.removeChild(li);
                                updateCandidatesOrder();
                            }
                        }
                    });
                });
            }

            // Edición inline para los nombres de candidatos ya existentes
            var candidateNameElements = document.querySelectorAll('.candidate-name');
            candidateNameElements.forEach(function (elem) {
                elem.addEventListener('blur', function () {
                    var candidateId = this.getAttribute('data-candidate-id');
                    var newName = this.innerText.trim();
                    if (!newName) return;
                    var li = this.closest('li');
                    var newOrder = Array.from(candidateList.children).indexOf(li) + 1;
                    if (candidateId.startsWith("new_")) {
                        fetch(domain + '/admin/votacion/candidatos/agregar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ votacion_id: votacionId, nombre: newName, orden: newOrder })
                        })
                            .then(function (response) { return response.json(); })
                            .then(function (data) {
                                if (data.success) {
                                    elem.setAttribute('data-candidate-id', data.candidato_id);
                                    var removeBtn = elem.parentElement.querySelector('.removeCandidate');
                                    if (removeBtn) {
                                        removeBtn.setAttribute('data-candidate-id', data.candidato_id);
                                    }
                                    console.log("Candidato agregado correctamente");
                                } else {
                                    throw new Error("Error al agregar candidato");
                                }
                            })
                            .catch(function (err) { console.error(err); });
                    } else {
                        fetch(domain + '/admin/votacion/candidatos/editar/' + candidateId, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nombre: newName, orden: newOrder })
                        })
                            .then(function (response) { return response.json(); })
                            .then(function (data) { console.log("Candidato actualizado."); })
                            .catch(function (err) { console.error("Error al actualizar candidato.", err); });
                    }
                });
            });

            // Eliminación inline para candidatos ya existentes
            var removeCandidateButtons = document.querySelectorAll('.removeCandidate');
            removeCandidateButtons.forEach(function (button) {
                button.addEventListener("click", function (e) {
                    e.stopPropagation();
                    if (confirm("¿Está seguro de eliminar este candidato?")) {
                        var li = this.closest('li');
                        var candidateId = this.getAttribute('data-candidate-id');
                        if (!candidateId.startsWith("new_")) {
                            fetch(domain + '/admin/votacion/candidatos/eliminar/' + candidateId, {
                                method: 'POST'
                            })
                                .then(function (response) { return response.json(); })
                                .then(function (data) {
                                    if (data.success) {
                                        li.parentElement.removeChild(li);
                                        updateCandidatesOrder();
                                    } else {
                                        alert("Error al eliminar candidato.");
                                    }
                                })
                                .catch(function (err) {
                                    console.error(err);
                                    alert("Error al eliminar candidato.");
                                });
                        } else {
                            li.parentElement.removeChild(li);
                            updateCandidatesOrder();
                        }
                    }
                });
            });
        }
    };

    window.PanelCandidates = PanelCandidates;
})();
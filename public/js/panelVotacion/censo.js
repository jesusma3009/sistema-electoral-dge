(function () {
    var PanelCenso = {
        init: function () {
            if (!window.panelVotacionContext) return;
            var domain = window.panelVotacionContext.domain;
            var votacionId = window.panelVotacionContext.votacionId;
            var censoTableBody = document.querySelector("#censoTable tbody");

            // Función auxiliar: Crea la fila HTML para un votante
            function createVoterRow(votante) {
                var tr = document.createElement("tr");
                tr.setAttribute("data-voter-id", votante.votante_id || votante.id);
                tr.innerHTML = '' +
                    '<td>' + votante.nombre + '</td>' +
                    '<td>' + votante.apellidos + '</td>' +
                    '<td>' + votante.email + '</td>' +
                    '<td>' +
                    '<button class="editVoterButton" ' +
                    'data-voter-id="' + (votante.votante_id || votante.id) + '" ' +
                    'data-nombre="' + votante.nombre + '" ' +
                    'data-apellidos="' + votante.apellidos + '" ' +
                    'data-email="' + votante.email + '">' +
                    'Editar' +
                    '</button>' +
                    '<button class="deleteVoterButton" ' +
                    'data-voter-id="' + (votante.votante_id || votante.id) + '" ' +
                    'data-votacion-id="' + votacionId + '">' +
                    'Eliminar' +
                    '</button>' +
                    '</td>';
                return tr;
            }

            // Agrega en el DOM el votante recibido
            function addVoterDOM(votante) {
                var row = createVoterRow(votante);
                censoTableBody.appendChild(row);
                bindEditDelete(row); // asigna los listeners a los botones recién creados
            }

            // Actualiza en el DOM la fila del votante editado
            function updateVoterDOM(voterId, nuevoVotante) {
                var row = censoTableBody.querySelector('tr[data-voter-id="' + voterId + '"]');
                if (row) {
                    // Actualiza cada celda (suponiendo el mismo orden definido en createVoterRow)
                    row.cells[0].textContent = nuevoVotante.nombre;
                    row.cells[1].textContent = nuevoVotante.apellidos;
                    row.cells[2].textContent = nuevoVotante.email;
                    var editButton = row.querySelector(".editVoterButton");
                    if (editButton) {
                        editButton.setAttribute("data-nombre", nuevoVotante.nombre);
                        editButton.setAttribute("data-apellidos", nuevoVotante.apellidos);
                        editButton.setAttribute("data-email", nuevoVotante.email);
                    }
                    var deleteButton = row.querySelector(".deleteVoterButton");
                    if (deleteButton) {
                        deleteButton.setAttribute("data-voter-id", voterId);
                    }
                }
            }

            // Elimina la fila del votante del DOM
            function deleteVoterDOM(voterId) {
                var row = censoTableBody.querySelector('tr[data-voter-id="' + voterId + '"]');
                if (row) {
                    row.parentNode.removeChild(row);
                }
            }

            function bindEditDelete(row) {
                var editButton = row.querySelector(".editVoterButton");
                if (editButton) {
                    editButton.addEventListener("click", function (e) {
                        e.stopPropagation();
                        var voterId = this.getAttribute('data-voter-id');
                        var nombre = this.getAttribute('data-nombre');
                        var apellidos = this.getAttribute('data-apellidos');
                        var email = this.getAttribute('data-email');
                        Swal.fire({
                            title: "Editar votante",
                            html:
                                '<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="' + nombre + '">' +
                                '<input id="swal-input2" class="swal2-input" placeholder="Apellidos" value="' + apellidos + '">' +
                                '<input id="swal-input3" class="swal2-input" placeholder="Correo electrónico" value="' + email + '">',
                            focusConfirm: false,
                            showCancelButton: true,
                            confirmButtonText: "Guardar",
                            preConfirm: function () {
                                var nuevoNombre = document.getElementById("swal-input1").value.trim();
                                var nuevosApellidos = document.getElementById("swal-input2").value.trim();
                                var nuevoEmail = document.getElementById("swal-input3").value.trim();
                                if (!nuevoNombre || !nuevosApellidos || !nuevoEmail) {
                                    Swal.showValidationMessage("Por favor complete todos los campos");
                                }
                                return { votante_id: voterId, nombre: nuevoNombre, apellidos: nuevosApellidos, email: nuevoEmail };
                            }
                        }).then(function (result) {
                            if (result.isConfirmed) {
                                fetch(domain + '/admin/votacion/censo/editar', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(result.value)
                                })
                                    .then(function (response) { return response.json(); })
                                    .then(function (data) {
                                        if (data.success) {
                                            Swal.fire("Éxito", "El votante se ha actualizado", "success");
                                            // Actualizamos el DOM sin recargar
                                            updateVoterDOM(voterId, result.value);
                                        } else {
                                            Swal.fire("Error", "No se pudo actualizar el votante", "error");
                                        }
                                    })
                                    .catch(function (err) {
                                        Swal.fire("Error", "Ha ocurrido un error", "error");
                                    });
                            }
                        });
                    });
                }
                var deleteButton = row.querySelector(".deleteVoterButton");
                if (deleteButton) {
                    deleteButton.addEventListener("click", function (e) {
                        e.stopPropagation();
                        var voterId = this.getAttribute('data-voter-id');
                        var votacionIdDelBoton = this.getAttribute('data-votacion-id') || votacionId;
                        Swal.fire({
                            title: "¿Eliminar votante?",
                            text: "Esta acción no se puede deshacer.",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Sí, eliminar",
                            cancelButtonText: "Cancelar"
                        }).then(function (result) {
                            if (result.isConfirmed) {
                                fetch(domain + '/admin/votacion/censo/eliminar', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        votacion_id: votacionIdDelBoton,
                                        votante_id: voterId
                                    })
                                })
                                    .then(function (response) { return response.json(); })
                                    .then(function (data) {
                                        if (data.success) {
                                            Swal.fire("Eliminado", "Votante eliminado de la votación", "success");
                                            // Eliminamos la fila del DOM
                                            deleteVoterDOM(voterId);
                                        } else {
                                            Swal.fire("Error", data.message || "No se pudo eliminar el votante", "error");
                                        }
                                    })
                                    .catch(function (err) {
                                        Swal.fire("Error", "Ha ocurrido un error", "error");
                                    });
                            }
                        });
                    });
                }
            }

            // Asignar listeners a cada fila que ya exista en tabla
            var existingRows = censoTableBody.querySelectorAll("tr");
            existingRows.forEach(function (row) {
                bindEditDelete(row);
            });

            // Importar CSV (Censo)
            var importCsvButton = document.getElementById("importCsvButton");
            if (importCsvButton) {
                importCsvButton.addEventListener("click", function () {
                    var input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".csv";
                    input.onchange = function (e) {
                        var file = e.target.files[0];
                        if (!file) return;
                        var reader = new FileReader();
                        reader.onload = function (event) {
                            var csvData = event.target.result;
                            var lines = csvData.split("\n").filter(function (line) { return line.trim() !== ""; });
                            // Se el encabezado y se eliminan las líneas vacías
                            var header = lines.shift();
                            var voters = [];
                            lines.forEach(function (line) {
                                var parts = line.split(",");
                                if (parts.length >= 3) {
                                    voters.push({
                                        nombre: parts[0].trim(),
                                        apellidos: parts[1].trim(),
                                        email: parts[2].trim()
                                    });
                                }
                            });
                            fetch(domain + '/admin/votacion/censo/import', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ voters: voters, votacion_id: votacionId })
                            })
                            .then(function (response) { return response.json(); })
                            .then(function (data) {
                                if (data.success) {
                                    Swal.fire("Éxito", "Censo importado correctamente.", "success");
                                    if (data.nuevos && Array.isArray(data.nuevos)) {
                                        data.nuevos.forEach(function (votante) {
                                            addVoterDOM(votante);
                                        });
                                    }
                                } else {
                                    Swal.fire("Error", "Error al importar el CSV.", "error");
                                }
                            })
                            .catch(function (err) {
                                console.error(err);
                                Swal.fire("Error", "Error al importar el CSV.", "error");
                            });
                        };
                        reader.readAsText(file);
                    };
                    input.click();
                });
            }

            // Agregar persona al censo
            var addVoterButton = document.getElementById("addVoterButton");
            if (addVoterButton) {
                addVoterButton.addEventListener("click", function () {
                    Swal.fire({
                        title: "Agregar Persona",
                        html:
                            '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
                            '<input id="swal-input2" class="swal2-input" placeholder="Apellidos">' +
                            '<input id="swal-input3" class="swal2-input" placeholder="Correo electrónico">',
                        focusConfirm: false,
                        showCancelButton: true,
                        confirmButtonText: "Agregar",
                        preConfirm: function () {
                            var nombre = document.getElementById("swal-input1").value.trim();
                            var apellidos = document.getElementById("swal-input2").value.trim();
                            var email = document.getElementById("swal-input3").value.trim();
                            if (!nombre || !apellidos || !email) {
                                Swal.showValidationMessage("Por favor complete todos los campos");
                            }
                            return { votacion_id: votacionId, nombre: nombre, apellidos: apellidos, email: email };
                        }
                    }).then(function (result) {
                        if (result.isConfirmed) {
                            fetch(domain + "/admin/votacion/censo/agregar", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(result.value)
                            })
                                .then(function (response) { return response.json(); })
                                .then(function (data) {
                                    if (data.success) {
                                        Swal.fire("Éxito", "Persona agregada al censo correctamente.", "success");
                                        result.value.votante_id = data.votante_id;
                                        addVoterDOM(result.value);
                                    } else {
                                        Swal.fire("Error", "No se pudo agregar la persona.", "error");
                                    }
                                })
                                .catch(function (err) {
                                    console.error(err);
                                    Swal.fire("Error", "No se pudo agregar la persona.", "error");
                                });
                        }
                    });
                });
            }
        }
    };
    window.PanelCenso = PanelCenso;
})();
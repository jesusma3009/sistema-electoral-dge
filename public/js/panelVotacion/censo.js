(function () {
    var PanelCenso = {
        init: function () {
            if (!window.panelVotacionContext) return;
            var domain = window.panelVotacionContext.domain;
            var votacionId = window.panelVotacionContext.votacionId;

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
                            lines.shift(); // Remover encabezado (si lo hay)
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
                                body: JSON.stringify({ voters: voters })
                            })
                                .then(function (response) { return response.json(); })
                                .then(function (data) {
                                    alert("Censo importado correctamente.");
                                    location.reload();
                                })
                                .catch(function (err) {
                                    console.error(err);
                                    alert("Error al importar el CSV.");
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
                                .then(function () {
                                    Swal.fire("Éxito", "Persona agregada al censo correctamente.", "success")
                                        .then(function () { location.reload(); });
                                })
                                .catch(function (err) {
                                    console.error(err);
                                    Swal.fire("Error", "No se pudo agregar la persona.", "error");
                                });
                        }
                    });
                });
            }

            // Editar votante (persona en el censo)
            var editVoterButtons = document.querySelectorAll('.editVoterButton');
            editVoterButtons.forEach(function (button) {
                button.addEventListener("click", function (e) {
                    e.stopPropagation();
                    var voterId = this.getAttribute('data-voter-id');
                    // Obtener datos desde los atributos del botón
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
                                        Swal.fire("Éxito", "El votante se ha actualizado", "success")
                                            .then(function () { location.reload(); });
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
            });

            // Eliminar votante
            var deleteVoterButtons = document.querySelectorAll('.deleteVoterButton');
            deleteVoterButtons.forEach(function (button) {
                button.addEventListener("click", function (e) {
                    e.stopPropagation();
                    var voterId = this.getAttribute('data-voter-id');
                    // Se puede extraer el id de votación desde el atributo o usar votacionId
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
                                        Swal.fire("Eliminado", "Votante eliminado de la votación", "success")
                                            .then(function () { location.reload(); });
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
            });
        }
    };
    window.PanelCenso = PanelCenso;
})();
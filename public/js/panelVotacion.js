document.addEventListener("DOMContentLoaded", function () {
	const data = document.querySelector('.js-data');
	const domain = data.getAttribute('data-domain');
	const votacionId = data.getAttribute('data-votacion-id');

	/* Cambio de pestañas */
	const tabs = document.querySelectorAll('.menu ul li');
	const panels = document.querySelectorAll('.panel-panel');
	tabs.forEach(tab => {
		tab.addEventListener('click', function () {
			tabs.forEach(t => t.classList.remove('active'));
			panels.forEach(panel => panel.classList.remove('active'));
			this.classList.add('active');
			const tabId = this.getAttribute('data-tab');
			document.getElementById(tabId).classList.add('active');
		});
	});

	/* Lista de candidatos y función para actualizar el orden */
	const candidateList = document.querySelector('.candidates-checklist ul');

	function updateCandidatesOrder() {
		const candidateItems = candidateList.querySelectorAll('li');
		candidateItems.forEach((item, index) => {
			const candidateId = item.getAttribute('data-candidate-id');
			let candidateName = item.querySelector('.candidate-name').innerText.trim();
			if (!candidateName) candidateName = "Sin nombre";
			if (!candidateId.startsWith("new_")) {
				fetch(domain + '/admin/votacion/candidatos/editar/' + candidateId, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ nombre: candidateName, orden: index + 1 })
				})
					.then(response => response.json())
					.then(data => {
						if (!data.success) {
							console.error("Error actualizando el orden para el candidato " + candidateId);
						}
					})
					.catch(err => console.error(err));
			}
		});
	}

	/* Inicialización de Drag & Drop para candidatos */
	let dragSrcEl = null;

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
			const parent = this.parentNode;
			parent.insertBefore(dragSrcEl, this);
			updateCandidatesOrder();
		}
		return false;
	}

	function handleDragEnd(e) {
		candidateItems.forEach(item => item.classList.remove('over'));
	}

	let candidateItems = candidateList.querySelectorAll('li');
	candidateItems.forEach(function (item) {
		item.setAttribute('draggable', 'true');
		item.addEventListener('dragstart', handleDragStart, false);
		item.addEventListener('dragenter', handleDragEnter, false);
		item.addEventListener('dragover', handleDragOver, false);
		item.addEventListener('dragleave', handleDragLeave, false);
		item.addEventListener('drop', handleDrop, false);
		item.addEventListener('dragend', handleDragEnd, false);
	});

	/* Importar CSV (Censo) */
	const importCsvButton = document.getElementById("importCsvButton");
	if (importCsvButton) {
		importCsvButton.addEventListener("click", function () {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".csv";
			input.onchange = e => {
				const file = e.target.files[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onload = event => {
					const csvData = event.target.result;
					const lines = csvData.split("\n").filter(line => line.trim() !== "");
					lines.shift();
					const voters = [];
					lines.forEach(line => {
						const parts = line.split(",");
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
						.then(response => response.json())
						.then(data => {
							alert("Censo importado correctamente.");
							location.reload();
						})
						.catch(err => {
							console.error(err);
							alert("Error al importar el CSV.");
						});
				};
				reader.readAsText(file);
			};
			input.click();
		});
	}

	/* Guardar configuración de votación */
	const saveVotacionConfigButton = document.getElementById("saveVotacionConfig");
	if (saveVotacionConfigButton) {
		saveVotacionConfigButton.addEventListener("click", function () {
			const votoNulo = document.getElementById("votoNulo").checked;
			const votoBlanco = document.getElementById("votoBlanco").checked;
			const fechaFin = document.getElementById("fecha_fin").value.trim();
			const configData = {
				votacion_id: votacionId,
				votoNulo: votoNulo,
				votoBlanco: votoBlanco,
				fecha_fin: fechaFin
			};
			fetch(domain + '/admin/votacion/configuracion/guardar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(configData)
			})
				.then(response => response.json())
				.then(data => {
					alert("Configuración guardada correctamente.");
				})
				.catch(err => {
					console.error(err);
					alert("Error al guardar la configuración.");
				});
		});
	}

	/* Agregar candidato inline */
	const addCandidateButton = document.getElementById("addCandidateButton");
	if (addCandidateButton) {
		addCandidateButton.addEventListener("click", function () {
			const newCandidateId = 'new_' + Date.now();
			const li = document.createElement('li');
			li.setAttribute('data-candidate-id', newCandidateId);
			li.setAttribute('draggable', 'true');

			const handle = document.createElement('span');
			handle.className = 'candidate-handle';
			handle.title = 'Arrastra para reordenar';
			handle.innerHTML = '&#9776;';
			li.appendChild(handle);

			const span = document.createElement('span');
			span.className = 'candidate-name';
			span.contentEditable = "true";
			span.setAttribute('data-candidate-id', newCandidateId);
			span.innerText = "Nuevo candidato";
			li.appendChild(span);

			const removeButton = document.createElement('div');
			removeButton.className = 'removeCandidate';
			removeButton.setAttribute('data-candidate-id', newCandidateId);
			removeButton.title = 'Eliminar candidato';
			removeButton.innerText = '🗑️';
			li.appendChild(removeButton);

			candidateList.appendChild(li);

			li.addEventListener('dragstart', handleDragStart, false);
			li.addEventListener('dragenter', handleDragEnter, false);
			li.addEventListener('dragover', handleDragOver, false);
			li.addEventListener('dragleave', handleDragLeave, false);
			li.addEventListener('drop', handleDrop, false);
			li.addEventListener('dragend', handleDragEnd, false);

			span.addEventListener('blur', function () {
				const candidateId = this.getAttribute('data-candidate-id');
				const newName = this.innerText.trim();
				if (!newName) return;
				const liParent = this.closest('li');
				const newOrder = Array.from(candidateList.children).indexOf(liParent) + 1;
				if (candidateId.startsWith("new_")) {
					fetch(domain + '/admin/votacion/candidatos/agregar', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ votacion_id: votacionId, nombre: newName, orden: newOrder })
					})
						.then(response => response.json())
						.then(data => {
							if (data.success) {
								this.setAttribute('data-candidate-id', data.candidato_id);
								li.setAttribute('data-candidate-id', data.candidato_id);
								removeButton.setAttribute('data-candidate-id', data.candidato_id);
							} else {
								throw new Error("Error al agregar candidato");
							}
						})
						.catch(err => console.error(err));
				} else {
					fetch(domain + '/admin/votacion/candidatos/editar/' + candidateId, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ nombre: newName, orden: newOrder })
					})
						.then(response => response.json())
						.then(data => console.log("Candidato actualizado."))
						.catch(err => console.error("Error al actualizar candidato.", err));
				}
			});

			removeButton.addEventListener("click", function (e) {
				e.stopPropagation();
				if (confirm("¿Está seguro de eliminar este candidato?")) {
					const candidateId = this.getAttribute('data-candidate-id');
					if (!candidateId.startsWith("new_")) {
						fetch(domain + '/admin/votacion/candidatos/eliminar/' + candidateId, {
							method: 'POST'
						})
							.then(response => response.json())
							.then(data => {
								if (data.success) {
									li.parentElement.removeChild(li);
									updateCandidatesOrder();
								} else {
									alert("Error al eliminar candidato.");
								}
							})
							.catch(err => {
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

	/* Inline edición: Título y Descripción de la Votación */
	const votacionTitle = document.getElementById('votacionTitle');
	const votacionDescription = document.getElementById('votacionDescription');

	function updateVotacionDetails() {
		const newTitle = votacionTitle.innerText.trim();
		const newDescription = votacionDescription.innerText.trim();
		fetch(domain + '/admin/votacion/editar/detalles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ votacion_id: votacionId, nombre: newTitle, descripcion: newDescription })
		})
			.then(response => response.json())
			.then(data => console.log("Detalles de votación actualizados."))
			.catch(err => console.error("Error al actualizar detalles de la votación.", err));
	}

	function checkPlaceholder(el) {
		if (!el.textContent.trim()) {
			el.innerHTML = "";
		}
	}

	if (votacionTitle) {
		votacionTitle.addEventListener('blur', function () {
			checkPlaceholder(votacionTitle);
			updateVotacionDetails();
		});
	}

	if (votacionDescription) {
		votacionDescription.addEventListener('blur', function () {
			checkPlaceholder(votacionDescription);
			updateVotacionDetails();
		});
	}

	/* Inline edición: Nombres de candidatos para los que ya existían en la lista */
	const candidateNameElements = document.querySelectorAll('.candidate-name');
	candidateNameElements.forEach(elem => {
		elem.addEventListener('blur', function () {
			const candidateId = this.getAttribute('data-candidate-id');
			const newName = this.innerText.trim();
			if (!newName) return;
			const li = this.closest('li');
			const newOrder = Array.from(candidateList.children).indexOf(li) + 1;
			if (candidateId.startsWith("new_")) {
				fetch(domain + '/admin/votacion/candidatos/agregar', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ votacion_id: votacionId, nombre: newName, orden: newOrder })
				})
					.then(response => response.json())
					.then(data => {
						if (data.success) {
							this.setAttribute('data-candidate-id', data.candidato_id);
							const removeBtn = this.parentElement.querySelector('.removeCandidate');
							if (removeBtn) {
								removeBtn.setAttribute('data-candidate-id', data.candidato_id);
							}
							console.log("Candidato agregado correctamente");
						} else {
							throw new Error("Error al agregar candidato");
						}
					})
					.catch(err => console.error(err));
			} else {
				// Para actualizar, enviamos también el nuevo orden
				fetch(domain + '/admin/votacion/candidatos/editar/' + candidateId, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ nombre: newName, orden: newOrder })
				})
					.then(response => response.json())
					.then(data => console.log("Candidato actualizado."))
					.catch(err => console.error("Error al actualizar candidato.", err));
			}
		});
	});

	/* Inline eliminación: Candidatos ya existentes */
	document.querySelectorAll('.removeCandidate').forEach(button => {
		button.addEventListener("click", function (e) {
			e.stopPropagation();
			if (confirm("¿Está seguro de eliminar este candidato?")) {
				const li = this.closest('li');
				const candidateId = this.getAttribute('data-candidate-id');
				if (!candidateId.startsWith("new_")) {
					fetch(domain + '/admin/votacion/candidatos/eliminar/' + candidateId, {
						method: 'POST'
					})
						.then(response => response.json())
						.then(data => {
							if (data.success) {
								li.parentElement.removeChild(li);
								updateCandidatesOrder();
							} else {
								alert("Error al eliminar candidato.");
							}
						})
						.catch(err => {
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

	/* Agregar persona al censo */
	const addVoterButton = document.getElementById("addVoterButton");
	if (addVoterButton) {
		addVoterButton.addEventListener("click", function () {
			Swal.fire({
				title: "Agregar Persona",
				html:
					`<input id="swal-input1" class="swal2-input" placeholder="Nombre">
           <input id="swal-input2" class="swal2-input" placeholder="Apellidos">
           <input id="swal-input3" class="swal2-input" placeholder="Correo electrónico">`,
				focusConfirm: false,
				showCancelButton: true,
				confirmButtonText: "Agregar",
				preConfirm: () => {
					const nombre = document.getElementById("swal-input1").value.trim();
					const apellidos = document.getElementById("swal-input2").value.trim();
					const email = document.getElementById("swal-input3").value.trim();
					if (!nombre || !apellidos || !email) {
						Swal.showValidationMessage("Por favor complete todos los campos");
					}
					return { nombre, apellidos, email };
				},
			}).then((result) => {
				if (result.isConfirmed) {
					fetch(domain + "/admin/votacion/censo/agregar", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(result.value),
					})
						.then((response) => response.json())
						.then(() => {
							Swal.fire("Éxito", "Persona agregada al censo correctamente.", "success")
								.then(() => location.reload());
						})
						.catch((err) => {
							console.error(err);
							Swal.fire("Error", "No se pudo agregar la persona.", "error");
						});
				}
			});
		});
	}
});
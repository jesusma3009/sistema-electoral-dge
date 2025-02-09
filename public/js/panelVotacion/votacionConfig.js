(function () {
  var PanelConfig = {
    init: function () {
      if (!window.panelVotacionContext) return;
      var domain = window.panelVotacionContext.domain;
      var votacionId = window.panelVotacionContext.votacionId;

      // Guardar configuración de votación
      var saveVotacionConfigButton = document.getElementById("saveVotacionConfig");
      if (saveVotacionConfigButton) {
        saveVotacionConfigButton.addEventListener("click", function () {
          var votoNulo = document.getElementById("votoNulo").checked;
            var votoBlanco = document.getElementById("votoBlanco").checked;
            var fechaFinInput = document.getElementById("fecha_fin").value.trim();
            if (!fechaFinInput) {
            Swal.fire({
              icon: 'warning',
              title: 'Falta Fecha',
              text: 'Debe introducir la fecha de cierre.'
            });
            return;
            }
            var fechaFin = fechaFinInput;
            if (!fechaFin.includes(':')) {
            // Si no se especifican los minutos, agregar ":00"
            fechaFin += ":00";
            }
          var fechaFin = document.getElementById("fecha_fin").value.trim();
          var configData = {
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
            .then(function (response) { return response.json(); })
            .then(function (data) {
              alert("Configuración guardada correctamente.");
            })
            .catch(function (err) {
              console.error(err);
              alert("Error al guardar la configuración.");
            });
        });
      }

      // Edición inline: Título y Descripción de la Votación
      var votacionTitle = document.getElementById('votacionTitle');
      var votacionDescription = document.getElementById('votacionDescription');

      function updateVotacionDetails() {
        var newTitle = votacionTitle.innerText.trim();
        var newDescription = votacionDescription.innerText.trim();
        fetch(domain + '/admin/votacion/editar/detalles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ votacion_id: votacionId, nombre: newTitle, descripcion: newDescription })
        })
          .then(function (response) { return response.json(); })
          .then(function (data) { console.log("Detalles de votación actualizados."); })
          .catch(function (err) { console.error("Error al actualizar detalles de la votación.", err); });
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
    }
  };

  window.PanelConfig = PanelConfig;
})();
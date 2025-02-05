let privateKeyJwk = null;
let publicKeyJwk = null;
let claveGuardada = false; // Indica si la clave privada ya fue guardada

// Función para generar el par de claves (ejemplo utilizando RSA-OAEP)
async function generateKeyPair() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true, // claves extraíbles
            ["encrypt", "decrypt"]
        );
        // Exportar la clave pública en formato JWK
        publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        // Exportar la clave privada en formato JWK y almacenarla para guardar/descargar
        privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
        console.log("Par de claves generado correctamente.");
    } catch (error) {
        console.error("Error al generar el par de claves:", error);
    }
}

// Guarda la clave privada usando File System Access API o descarga tradicional
async function savePrivateKeyAsFile() {
    const dataStr = JSON.stringify(privateKeyJwk, null, 2);
    if (window.showSaveFilePicker) {
        try {
            const options = {
                suggestedName: 'clave_privada.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            };
            const handle = await window.showSaveFilePicker(options);
            const writableStream = await handle.createWritable();
            await writableStream.write(dataStr);
            await writableStream.close();
            claveGuardada = true;
            alert("Clave privada guardada correctamente.");
        } catch (error) {
            console.error("No se pudo guardar la clave privada:", error);
            alert("No se pudo guardar la clave privada. Inténtelo de nuevo.");
        }
    } else {
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clave_privada.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        claveGuardada = true;
        alert("La descarga de la clave privada se ha iniciado. Por favor, confirme que ha guardado el archivo de forma segura.");
    }
    updateContinueButton();
}

function updateContinueButton() {
    const continueButton = document.getElementById("continueButton");
    continueButton.disabled = !claveGuardada;
}

// Actualización del botón "continue" para crear la votación y redirigir
document.getElementById("continueButton").addEventListener("click", async () => {
    const data = document.querySelector('.js-data');
    const domain = data.getAttribute('data-domain');
    if (claveGuardada) {
        try {
            // Preparamos el payload incluyendo el tipo de votación y la clave pública (ambos enviados desde JS)
            const payload = {
                tipo: "simple",
                clave_publica: publicKeyJwk // Se envía el objeto JWK de la clave pública
            };

            const response = await fetch(domain + '/admin/votacion/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                console.error("Error al crear la votación en el servidor.");
                alert("Error al crear la votación.");
                return;
            }
            const json = await response.json();
            if (json.success && json.votacion_id) {
                // Redirige a la ruta correspondiente usando el id de la votación
                window.location.href = domain + '/admin/' + json.votacion_id + '/panel';
            } else {
                alert("Error al crear la votación: " + (json.error || "Respuesta inesperada"));
            }
        } catch (error) {
            console.error("Error en la petición para crear la votación:", error);
            alert("Error al crear la votación. Consulte la consola para más detalles.");
        }
    } else {
        alert("Debe guardar la clave privada antes de continuar.");
    }
});

document.getElementById("saveButton").addEventListener("click", savePrivateKeyAsFile);
document.addEventListener("DOMContentLoaded", generateKeyPair);
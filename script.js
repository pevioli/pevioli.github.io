// script.js

// ¡IMPORTANTE!: Reemplaza esta URL con la "URL de la aplicación web" que obtuviste en el Paso 4 del Backend.
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxFar0vvgyJtcqWHlagXIdhwYnE_PeobTvpqKGmWiZFb4NcKEpwZKCAuJ37Exq3Dud9/exec'; // Ejemplo: 'https://script.google.com/macros/s/AKfycbz_XXXXXXXXXXXX_YYYYYYYYYYY/exec'

const fileInput = document.getElementById('fileInput');
const fileCountSpan = document.getElementById('fileCount');
const previewArea = document.getElementById('previewArea');
const uploadButton = document.getElementById('uploadButton');
const statusMessage = document.getElementById('statusMessage');

let selectedFiles = []; // Array para almacenar los archivos seleccionados

// Event Listener para cuando se seleccionan archivos
fileInput.addEventListener('change', (event) => {
    selectedFiles = Array.from(event.target.files); // Convertir FileList a Array
    fileCountSpan.textContent = `${selectedFiles.length} archivo(s) seleccionado(s)`;
    uploadButton.disabled = selectedFiles.length === 0; // Habilitar/deshabilitar botón

    displayImagePreviews();
    clearStatusMessage();
});

// Event Listener para el botón de subir
uploadButton.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        showStatusMessage('error', 'Por favor, selecciona al menos una foto para subir.');
        return;
    }

    uploadButton.disabled = true; // Deshabilitar botón durante la subida
    showStatusMessage('info', 'Subiendo fotos... Por favor, espera.');

    const uploadPromises = selectedFiles.map(file => uploadFile(file));

    try {
        const results = await Promise.allSettled(uploadPromises); // Esperar que todas las promesas se resuelvan

        let successCount = 0;
        let errorMessages = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    successCount++;
                    console.log(`Foto ${selectedFiles[index].name} subida con éxito.`);
                } else {
                    errorMessages.push(`Error al subir ${selectedFiles[index].name}: ${result.value.message}`);
                    console.error(`Error al subir ${selectedFiles[index].name}:`, result.value.message);
                }
            } else {
                errorMessages.push(`Fallo en la conexión para ${selectedFiles[index].name}: ${result.reason.message}`);
                console.error(`Fallo en la conexión para ${selectedFiles[index].name}:`, result.reason);
            }
        });

        if (successCount === selectedFiles.length) {
            showStatusMessage('success', `¡${successCount} foto(s) subida(s) con éxito!`);
        } else if (successCount > 0) {
            showStatusMessage('info', `Se subieron ${successCount} de ${selectedFiles.length} fotos. Algunos errores ocurrieron: ${errorMessages.join('; ')}`);
        } else {
            showStatusMessage('error', `No se pudo subir ninguna foto. Errores: ${errorMessages.join('; ')}`);
        }

        // Limpiar después de la subida
        fileInput.value = ''; // Limpia el input de archivos
        selectedFiles = [];
        fileCountSpan.textContent = '0 archivos seleccionados';
        previewArea.innerHTML = ''; // Limpiar previsualizaciones
    } catch (error) {
        showStatusMessage('error', 'Ocurrió un error inesperado durante la subida masiva. Intenta de nuevo.');
        console.error('Error en Promise.allSettled:', error);
    } finally {
        uploadButton.disabled = false; // Re-habilitar el botón
    }
});

/**
 * Convierte un archivo File a una cadena Base64.
 * @param {File} file El archivo a convertir.
 * @return {Promise<string>} Una promesa que resuelve con la cadena Base64.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1]; // Extraer solo la parte Base64
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Sube un archivo individual al backend de Apps Script.
 * @param {File} file El archivo a subir.
 * @return {Promise<Object>} Una promesa que resuelve con la respuesta del backend.
 */
async function uploadFile(file) {
    try {
        const base64Data = await fileToBase64(file);

        const dataToSend = {
            fileName: file.name,
            mimeType: file.type,
            base64Data: base64Data
        };

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors', // Crucial para peticiones entre diferentes orígenes
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // Apps Script espera text/plain para POST
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Error al subir el archivo:', file.name, error);
        return { success: false, message: error.message };
    }
}

/**
 * Muestra previsualizaciones de las imágenes seleccionadas.
 */
function displayImagePreviews() {
    previewArea.innerHTML = ''; // Limpiar previsualizaciones anteriores
    selectedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('image-preview');
                previewArea.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Muestra un mensaje de estado en la interfaz.
 * @param {string} type Tipo de mensaje ('success', 'error', 'info').
 * @param {string} message Contenido del mensaje.
 */
function showStatusMessage(type, message) {
    statusMessage.textContent = message;
    statusMessage.className = `message ${type}`; // Cambia la clase para el estilo
    statusMessage.style.opacity = 1; // Hace visible el mensaje
}

/**
 * Oculta el mensaje de estado.
 */
function clearStatusMessage() {
    statusMessage.style.opacity = 0; // Oculta el mensaje
    // Retrasar la eliminación de la clase para permitir la transición CSS
    setTimeout(() => {
        statusMessage.className = 'message';
        statusMessage.textContent = '';
    }, 300);
}

// Inicialmente, el botón de subir está deshabilitado
uploadButton.disabled = true;
import { API_BASE_URL, URL_PAGE_BASE } from './config.js';

// Función para hacer la consulta y mostrar los resultados dinámicamente
async function fetchAndDisplayStatistics(userQuestion) {
    try {
        // Realiza la solicitud a la API
        const response = await fetch(`${API_BASE_URL}/generate-statistics-endpoint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: userQuestion })
        });

        const data = await response.json();

        // Limpiar los contenedores previos
        const answerContainer = document.getElementById('answer-container')
        answerContainer.innerHTML = '';
        const tableContainer = document.getElementById('table-container')
        tableContainer.innerHTML = '';
        
        if(data.image_base64) {
            const image = document.createElement('img');
            image.src = `data:image/png;base64,${data.image_base64}`;
            answerContainer.appendChild(image);
        } else {
            createCountTable(data);
        }
    } catch (error) {
        createErrorModal("Error al obtener estadísticas", "Ocurrió un error al intentar obtener las estadísticas. Por favor, intenta de nuevo más tarde.");
    }
}

// Función para crear una tabla de conteos generales
function createCountTable(data) {
    // Asegurarse de que el contenedor exista
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer) {
        console.error("El contenedor 'table-container' no existe.");
        return;
    }

    // Verificar que la data no esté vacía
    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<p>No hay datos para mostrar.</p>';
        return;
    }

    // Iniciar la tabla HTML
    let tableHTML = `<div class="table-responsive">
        <table class="table">
            <thead>
                <tr>`;
    
    // Crear los encabezados de la tabla dinámicamente a partir de las claves del primer objeto
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        // Limpiar los encabezados para mejor presentación (por ejemplo, transformarlos de snake_case a título)
        const headerText = header.replace(/_/g, ' ').toUpperCase();
        tableHTML += `<th>${headerText}</th>`;
    });

    tableHTML += `</tr></thead><tbody>`;

    // Crear las filas de la tabla a partir de los datos
    data.forEach(item => {
        tableHTML += `<tr>`;
        headers.forEach(header => {
            let value = item[header];
            // Si el valor es null o vacío, mostramos "Sin valor"
            value = (value === null || value === '') ? 'Sin valor' : value;
            tableHTML += `<td>${value}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table></div>`;
    
    // Insertar la tabla generada en el contenedor
    tableContainer.innerHTML = tableHTML;
}

// Manejador de evento para enviar la pregunta
document.getElementById('submit-question-btn').addEventListener('click', () => {
    const question = document.getElementById('user-question').value;
    if (question.trim()) {
        fetchAndDisplayStatistics(question);
    } else {
        alert("Por favor, escribe una pregunta.");
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Llamadas a las funciones para cargar datos dinámicamente
    fetchCategories();       // Obtener categorías
    fetchCountries();        // Obtener países
    fetchOrganizers();       // Obtener organizadores

    const userId = localStorage.getItem("user_id");

    // Verificar si el usuario es administrador
    fetch(`${API_BASE_URL}/users/${userId}/is-admin`)
        .then(response => response.json())
        .then(data => {
            if (data.is_admin) {
                document.body.style.display = "block";
            } else {
                window.location.href = "../";
            }
        })
        .catch(error => {
            console.error("Error:", error);
            window.location.href = "/";
        });
    
    // Obtener el nombre del usuario y mostrar un mensaje de bienvenida
    fetch(`${API_BASE_URL}/users/${userId}`)
        .then(response => response.json())
        .then(data => {
            const userName = data.full_name;
            const greetingElement = document.getElementById("greeting");
            const currentHour = new Date().getHours();
            let greetingMessage;

            if (currentHour < 12) {
                greetingMessage = "un bonito día";
            } else if (currentHour < 18) {
                greetingMessage = "una bonita tarde";
            } else {
                greetingMessage = "una bonita noche";
            }

            greetingElement.textContent = `Hola ${userName}, StellarGather te desea ${greetingMessage}.`;
            document.body.style.display = "block";
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            document.body.style.display = "block";
        });
    
    // Evento para crear un organizador
    const createOrganizerForm = document.getElementById("create-organizer-form");
    createOrganizerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const organizerData = {
            name: document.getElementById("organizer-name").value,
            email: document.getElementById("organizer-email").value,
            phone: document.getElementById("organizer-phone").value
        };
        await createOrganizer(organizerData);

        
    });

    // Evento para crear un evento
    const createEventForm = document.getElementById("create-event-form");
    createEventForm.addEventListener("submit", async function (e) {
        e.preventDefault();
    
        // Validación de la descripción
        const description = document.getElementById("event-description").value.trim();
        if (description.length < 250) {
            createErrorModal("Descripción muy corta", "La descripción del evento debe tener al menos 250 caracteres.");
            return;
        }
    
        // Crear los datos del evento
        const eventData = {
            name: document.getElementById("event-name").value,
            description: document.getElementById("event-description").value,
            location: document.getElementById("event-location").value,
            city: document.getElementById("event-city").value,
            country: document.getElementById("event-country").value,
            date: document.getElementById("event-date").value,
            max_capacity: document.getElementById("event-capacity").value,
            price: document.getElementById("event-price").value,
            organizer_id: document.getElementById("event-organizer").value, 
        };
    
        try {
            // Crear el evento en el servidor
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
    
            const data = await response.json();
            const eventId = data.id;

            if (eventId) {
                await uploadEventImage(eventId);  

                try {
                    const selectedCategories = getSelectedCategories();
                    for (const categoryId of selectedCategories) {
                        await fetch(`${API_BASE_URL}/event_categories`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ event_id: eventId, category_id: categoryId })
                        });
                    }
                    createSuccessModal("Evento creado con éxito!");
                    setTimeout(() => {
                        location.reload();
                    }, 3000);
                } catch (error) {
                    createErrorModal("Error al asignar categorías", "Ocurrió un error al intentar asignar las categorías al evento. Por favor, intenta de nuevo más tarde.");
                }
            }
        } catch (error) {
            createErrorModal("Error al crear el evento", "Ocurrió un error al intentar crear el evento. Por favor, intenta de nuevo más tarde.");
        }
    });    

    // Evento para crear una categoría
    const createCategoryForm = document.getElementById("create-category-form");
    createCategoryForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const categoryData = {
            name: document.getElementById("category-name").value
        };
        await createCategory(categoryData);
    });
});

// Función para obtener las categorías desde la API
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();
        const categorySelect = document.getElementById("event-category");
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        // Añadir validación para no permitir seleccionar más de dos categorías
        categorySelect.addEventListener('change', function () {
            const selectedOptions = Array.from(this.selectedOptions);
            if (selectedOptions.length > 2) {
                createErrorModal("Error al seleccionar categorías", "No puedes seleccionar más de dos categorías para un evento.");
                this.value = selectedOptions.slice(0, 2).map(option => option.value);
            }
        });
    } catch (error) {
        createErrorModal("Error al obtener categorías", "Ocurrió un error al intentar obtener las categorías. Por favor, intenta de nuevo más tarde.");
    }
}

// Función para obtener los países desde Restcountries
async function fetchCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();
        const countrySelect = document.getElementById("event-country");
        const sortedCountries = countries.sort((a, b) => a.name.common.localeCompare(b.name.common)); // Ordenar países
        sortedCountries.forEach(country => {
            const option = document.createElement("option");
            option.value = country.translations.spa.common;
            option.textContent = country.name.common;
            countrySelect.appendChild(option);
        });
    } catch (error) {
        createErrorModal("Error al obtener países", "Ocurrió un error al intentar obtener los países. Por favor, intenta de nuevo más tarde.");
    }
}

// Función para obtener los organizadores desde la API
async function fetchOrganizers() {
    try {
        const response = await fetch(`${API_BASE_URL}/organizers`);
        const organizers = await response.json();
        const organizerSelect = document.getElementById("event-organizer");
        organizers.forEach(organizer => {
            const option = document.createElement("option");
            option.value = organizer.id;
            option.textContent = organizer.name;
            organizerSelect.appendChild(option);
        });
    } catch (error) {
        createErrorModal("Error al obtener organizadores", "Ocurrió un error al intentar obtener los organizadores. Por favor, intenta de nuevo más tarde.");
    }
}

// Obtener categorías seleccionadas
function getSelectedCategories() {
    const categorySelect = document.getElementById("event-category");
    const selectedOptions = Array.from(categorySelect.selectedOptions);
    return selectedOptions.map(option => option.value);
}


// Función para crear el organizador
async function createOrganizer(organizerData) {
    try {
        const response = await fetch(`${API_BASE_URL}/organizers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(organizerData)
        });
        const data = await response.json();
        const organizerId = data.id;

        if (organizerId) {
            await uploadOrganizerImage(organizerId);
            createSuccessModal("Organizador creado con éxito!");
            setTimeout(() => {
                location.reload();
            }, 3000);
        } else {
            throw new Error("No se pudo crear el organizador");
        }
    } catch (error) {
        createErrorModal("Error al crear el organizador", "Ocurrió un error al intentar crear el organizador. Por favor, intenta de nuevo más tarde.");
    }
}

// Función para crear la categoría
async function createCategory(categoryData) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        const data = await response.json();
        
        if (data.id) {
            createSuccessModal("Categoría creada con éxito!");
            setTimeout(() => {
                location.reload();
            }, 3000);
        } else {
            throw new Error("No se pudo crear la categoría");
        }
    } catch (error) {
        createErrorModal("Error al crear la categoría", "Ocurrió un error al intentar crear la categoría. Por favor, intenta de nuevo más tarde.");
    }
}

// Función para subir la imagen del evento
async function uploadEventImage(eventId) {
    const imageInput = document.getElementById("event-image");
    const imageFile = imageInput.files[0];

    if (imageFile) {
        // Validación de la imagen
        if (imageFile.type !== "image/webp") {
            createErrorModal("Formato de imagen inválido", "La imagen debe ser en formato .webp.");
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        await img.decode();

        // Validar el tamaño de la imagen (600x400)
        if (img.width !== 600 || img.height !== 400) {
            createErrorModal("Tamaño de imagen incorrecto", "La imagen debe tener un tamaño de 600x400 píxeles.");
            return;
        }

        // Crear un FormData para la subida de la imagen
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('event_id', eventId);

        // Subir la imagen al servidor
        try {
            const response = await fetch(`${URL_PAGE_BASE}/php/upload-event-image.php`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                console.log("Imagen subida correctamente.");
            } else {
                createErrorModal("Error al subir la imagen", "Ocurrió un error al intentar subir la imagen. Por favor, intenta de nuevo más tarde.");
            }
        } catch (error) {
            createErrorModal("Error al subir la imagen", "Ocurrió un error al intentar subir la imagen. Por favor, intenta de nuevo más tarde.");
        }
    }
}

// Función para subir la imagen del organizador
async function uploadOrganizerImage(organizerId) {
    const imageInput = document.getElementById("organizer-image");
    const imageFile = imageInput.files[0];

    if (imageFile) {
        // Validación de la imagen
        if (imageFile.type !== "image/webp") {
            createErrorModal("Formato de imagen inválido", "La imagen debe ser en formato .webp.");
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        await img.decode();

        // Validar el tamaño de la imagen (100x100)
        if (img.width !== 100 || img.height !== 100) {
            createErrorModal("Tamaño de imagen incorrecto", "La imagen debe tener un tamaño de 100x100 píxeles.");
            return;
        }

        // Crear un FormData para la subida de la imagen
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('organizer_id', organizerId);

        // Subir la imagen al servidor
        try {
            const response = await fetch(`${URL_PAGE_BASE}/php/upload-organizer-image.php`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                console.log("Imagen subida correctamente.");
            } else {
                createErrorModal("Error al subir la imagen", "Ocurrió un error al intentar subir la imagen. Por favor, intenta de nuevo más tarde.");
            }
        } catch (error) {
            createErrorModal("Error al subir la imagen", "Ocurrió un error al intentar subir la imagen. Por favor, intenta de nuevo más tarde.");
        }
    }
}

// Modales de éxito y error
function createSuccessModal(message) {
    const modalHtml = `
        <div class="modal fade" id="successModal" tabindex="-1" role="dialog" aria-labelledby="successModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="successModalLabel"><i class="fas fa-check-circle"></i> Acción Exitosa</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Usar el método modal de Bootstrap 4 para mostrar el modal
    $('#successModal').modal('show');

    // Remover el modal después de que se cierre
    $('#successModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

function createErrorModal(title, errorMessage, helpLink = '') {
    const modalHtml = `
        <div class="modal fade" id="errorModal" tabindex="-1" role="dialog" aria-labelledby="errorModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="errorModalLabel"><i class="fas fa-exclamation-circle"></i> ${title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body" style="text-align: justify;">
                        <p><i class="fas fa-info-circle"></i> ${errorMessage}</p>
                        ${helpLink ? `<p style="text-align: center;"><a href="${helpLink}" target="_blank">Obtener más información</a></p>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Usar el método modal de Bootstrap 4 para mostrar el modal
    $('#errorModal').modal('show');

    // Remover el modal después de que se cierre
    $('#errorModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}
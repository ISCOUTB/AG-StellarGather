import { API_BASE_URL, URL_PAGE_BASE } from './config.js';
import { createSuccessModal, createErrorModal } from './modals.js';
import { logError, logInteraction } from './interations-errors.js';

// Función para hacer la consulta y mostrar los resultados dinámicamente
async function fetchAndDisplayStatistics(userQuestion) {
    try {
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
        logError("Error al obtener estadísticas", 500, "API de estadísticas", error.message); // Registro de error
    }
}

// Función para crear una tabla de conteos generales
function createCountTable(data) {
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer) {
        console.error("El contenedor 'table-container' no existe.");
        return;
    }

    if (!data || data.length === 0) {
        tableContainer.innerHTML = '<p>No hay datos para mostrar.</p>';
        return;
    }

    let tableHTML = `<div class="table-responsive">
        <table class="table">
            <thead>
                <tr>`;

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const headerText = header.replace(/_/g, ' ').toUpperCase();
        tableHTML += `<th>${headerText}</th>`;
    });

    tableHTML += `</tr></thead><tbody>`;

    data.forEach(item => {
        tableHTML += `<tr>`;
        headers.forEach(header => {
            let value = item[header];
            value = (value === null || value === '') ? 'Sin valor' : value;
            tableHTML += `<td>${value}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table></div>`;
    tableContainer.innerHTML = tableHTML;
}

// Manejador de evento para enviar la pregunta
document.getElementById('submit-question-btn').addEventListener('click', () => {
    const question = document.getElementById('user-question').value;
    if (question.trim()) {
        const startTime = performance.now();
        fetchAndDisplayStatistics(question).finally(() => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            logInteraction(localStorage.getItem("user_id"), 'fetch-statistics', { question: question }, duration);
        });
        fetchAndDisplayStatistics(question);
    } else {
        alert("Por favor, escribe una pregunta.");
    }
});

document.addEventListener('DOMContentLoaded', function () {
    fetchCategories();
    fetchCountries();
    fetchOrganizers();

    const userId = localStorage.getItem("user_id");

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
            logError("Error de autenticación", 401, "Autenticación", error.message); // Registro de error
            window.location.href = "/";
        });

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
            logError("Error al obtener datos del usuario", 500, "API de usuarios", error.message); // Registro de error
            document.body.style.display = "block";
        });
    
    fetchGeneralStatistics();

    const today = new Date().toISOString().slice(0, 16);
    document.getElementById('event-date').setAttribute('min', today);
    
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

    const createEventForm = document.getElementById("create-event-form");
    createEventForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const description = document.getElementById("event-description").value.trim();
        if (description.length < 250) {
            createErrorModal("Descripción muy corta", "La descripción del evento debe tener al menos 250 caracteres.");
            logError("Descripción muy corta", 400, "Creación de evento", "La descripción del evento debe tener al menos 250 caracteres."); // Registro de error
            return;
        }

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
                    }, 2000);
                } catch (error) {
                    createErrorModal("Error al asignar categorías", "Ocurrió un error al intentar asignar las categorías al evento. Por favor, intenta de nuevo más tarde.");
                    logError("Error al asignar categorías", 500, "Creación de evento", error.message); // Registro de error
                }
            }
        } catch (error) {
            createErrorModal("Error al crear el evento", "Ocurrió un error al intentar crear el evento. Por favor, intenta de nuevo más tarde.");
            logError("Error al crear evento", 500, "Creación de evento", error.message); // Registro de error
        }
    });    

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
                logError("Error al seleccionar categorías", 400, "Creación de evento", "Se intentaron seleccionar más de dos categorías.");
                this.value = selectedOptions.slice(0, 2).map(option => option.value);
            }
        });
    } catch (error) {
        createErrorModal("Error al obtener categorías", "Ocurrió un error al intentar obtener las categorías. Por favor, intenta de nuevo más tarde.");
        logError("Error al obtener categorías", 500, "API de categorías", error.message); // Registro de error
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
        logError("Error al obtener países", 500, "API de países", error.message); // Registro de error
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
        logError("Error al obtener organizadores", 500, "API de organizadores", error.message); // Registro de error
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
            }, 2000);
        } else {
            throw new Error("No se pudo crear el organizador. No puedes crear organizadores duplicados.");
        }
    } catch (error) {
        createErrorModal("Error al crear el organizador", error);
        logError("Error al crear organizador", 500, "API de organizadores", error.message); // Registro de error
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
            }, 2000);
        } else {
            throw new Error("No se pudo crear la categoría. No puedes crear categorías duplicadas.");
        }
    } catch (error) {
        createErrorModal("Error al crear la categoría", error);
        logError("Error al crear categoría", 500, "API de categorías", error.message); // Registro de error
    }
}

// Función para subir la imagen del evento
async function uploadEventImage(eventId) {
    const imageInput = document.getElementById("event-image");
    const imageFile = imageInput.files[0];

    if (imageFile) {
        if (imageFile.type !== "image/webp") {
            createErrorModal("Formato de imagen inválido", "La imagen debe ser en formato .webp.");
            logError("Formato de imagen inválido", 400, "Subida de imagen", "La imagen no tiene formato webp.");
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        await img.decode();

        if (img.width !== 600 || img.height !== 400) {
            createErrorModal("Tamaño de imagen incorrecto", "La imagen debe tener un tamaño de 600x400 píxeles.");
            logError("Tamaño de imagen incorrecto", 400, "Subida de imagen", "La imagen no tiene el tamaño adecuado.");
            return;
        }

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('event_id', eventId);

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
                logError("Error al subir la imagen", 500, "Subida de imagen", result.message); // Registro de error
            }
        } catch (error) {
            createErrorModal("Error al subir la imagen", "Ocurrió un error al intentar subir la imagen. Por favor, intenta de nuevo más tarde.");
            logError("Error al subir la imagen", 500, "Subida de imagen", error.message); // Registro de error
        }
    }
}

// Función para subir la imagen del organizador
async function uploadOrganizerImage(organizerId) {
    const imageInput = document.getElementById("organizer-image");
    const imageFile = imageInput.files[0];

    if (imageFile) {
        if (imageFile.type !== "image/webp") {
            createErrorModal("Formato de imagen inválido", "La imagen debe ser en formato .webp.");
            logError("Formato de imagen inválido", 400, "Subida de imagen", "La imagen no tiene formato webp.");
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        await img.decode();

        if (img.width !== 200 || img.height !== 200) {
            createErrorModal("Tamaño de imagen incorrecto", "La imagen debe tener un tamaño de 100x100 píxeles.");
            logError("Tamaño de imagen incorrecto", 400, "Subida de imagen", "La imagen no tiene el tamaño adecuado.");
            return;
        }

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('organizer_id', organizerId);

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
                logError("Error al subir la imagen", 500, "Subida de imagen", result.message); // Registro de error
            }
        } catch (error) {
            createErrorModal("Error al subir la imagen", "Ocurrió un error al intentar subir la imagen. Por favor, intenta de nuevo más tarde.");
            logError("Error al subir la imagen", 500, "Subida de imagen", error.message); // Registro de error
        }
    }
}

// Función para obtener estadísticas generales
async function fetchGeneralStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/general-statistics`);
        const data = await response.json();

        document.getElementById("total-comments").textContent = data.total_comments;
        document.getElementById("avg-rating").textContent = data.avg_rating.toFixed(2);
        document.getElementById("total-registrations").textContent = data.total_registrations;
    } catch (error) {
        console.error("Error:", error);
        createErrorModal("Error al obtener estadísticas generales", "Ocurrió un error al intentar obtener las estadísticas generales. Por favor, intenta de nuevo más tarde.");
        logError("Error al obtener estadísticas generales", 500, "API de estadísticas generales", error.message);
    }
}
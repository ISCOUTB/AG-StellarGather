import { API_BASE_URL } from './config.js';

// Elemento contenedor de los eventos en el HTML
const eventsContainer = document.getElementById('events-container');

// Definir la función para obtener los 3 eventos próximos
async function fetchUpcomingEvents() {
    try {
        // Realizamos la solicitud a la API para obtener los próximos eventos
        const response = await fetch(`${API_BASE_URL}/upcoming-events?limit=3`);
        const events = await response.json();

        return events;
    } catch (error) {
        console.error("Error al cargar los eventos: ", error);
    }
}

// Función para obtener las categorías de un evento
async function fetchCategories(eventId) {
    try {
        const response = await fetch(`http://localhost:8010/events/${eventId}/categories`);
        const categories = await response.json();
        return categories;
    } catch (error) {
        console.error("Error al cargar las categorías: ", error);
        return [];
    }
}
// Función para cargar los eventos en el contenedor
async function loadEvents() {
    const events = await fetchUpcomingEvents();
    eventsContainer.innerHTML = '';
    
    for (const event of events) {
        // Obtener las categorías del evento
        const categories = await fetchCategories(event.id);
        const categoriesHtml = categories.map((cat, index) => {
            const separator = index > 0 ? `<span class="text-primary px-2">|</span>` : '';
            return `${separator}<a class="text-primary text-uppercase font-weight-medium" href="#">${cat.name}</a>`;
        }).join('');

        // Convertir fecha a formato de día y mes
        const eventDate = new Date(event.date);
        const day = String(eventDate.getDate()).padStart(2, '0');
        const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

        // Si el evento tiene una descripción, recortarla si es necesario
        const description = event.description && event.description.length > 70
            ? event.description.slice(0, 80) + '...'
            : event.description;

        // Generar el HTML para el evento
        eventsContainer.innerHTML += `
            <div class="col-lg-4 col-md-6 mb-5">
                <div class="position-relative mb-4">
                    <img class="img-fluid rounded w-100" src="img/event/${event.id}.webp" alt="${event.name}">
                    <div class="blog-date">
                        <h4 class="font-weight-bold mb-n1 text-primary">${day}</h4>
                        <small class="text-white text-uppercase">${month}</small>
                    </div>
                </div>
                <div class="d-flex mb-2">${categoriesHtml}</div>  <!-- Aquí se agregan las categorías -->
                <h5 class="font-weight-medium text-white mb-2">${event.name}</h5>
                <p class="mb-4 text-white">${description}</p>
                <a class="btn btn-sm btn-primary py-2" href="events/event.html?event_id=${event.id}">Ver Evento</a>
            </div>
        `;
    }
}

// Llamar a la función para cargar los eventos cuando la página se carga
window.onload = loadEvents;

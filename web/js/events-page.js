import { API_BASE_URL } from './config.js';

const eventsContainer = document.getElementById('events-container');
const paginationContainer = document.getElementById('pagination');
const eventsPerPage = 12;
let currentPage = 1;
let totalEvents = 0;

async function fetchEvents(page) {
    const response = await fetch(`${API_BASE_URL}/events-desc?page=${page}&limit=${eventsPerPage}`);
    const events = await response.json();
    return events;
}

async function fetchEventCount() {
    const response = await fetch(`${API_BASE_URL}/events-count`);
    const data = await response.json();
    totalEvents = data.event_count;
}

async function loadEvents(page) {
    const events = await fetchEvents(page);
    eventsContainer.innerHTML = '';

    for (const event of events) {
        const categories = await fetchCategories(event.id);
        const categoriesHtml = categories.map((cat, index) => {
            const separator = index > 0 ? `<span class="text-primary px-2">|</span>` : '';
            return `${separator}<a class="text-secondary text-uppercase font-weight-medium" href="events/category.html?category_id=${cat.id}">${cat.name}</a>`;
        }).join('');

        const eventDate = new Date(event.date);
        const day = String(eventDate.getDate()).padStart(2, '0');
        const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

        const description = event.description && event.description.length > 70
            ? event.description.slice(0, 80) + '...'
            : event.description;

        eventsContainer.innerHTML += `
            <div class="col-lg-4 col-md-6 mb-5">
                <div class="position-relative mb-4">
                    <img class="img-fluid rounded w-100" src="img/event/${event.id}.webp" alt="">
                    <div class="blog-date">
                        <h4 class="font-weight-bold mb-n1 text-primary">${day}</h4>
                        <small class="text-white text-uppercase">${month}</small>
                    </div>
                </div>
                <div class="d-flex mb-2">${categoriesHtml}</div>
                <h5 class="font-weight-medium mb-2">${event.name}</h5>
                <p class="mb-4">${description}</p>
                <a class="btn btn-sm btn-primary py-2" href="events/event.html?event_id=${event.id}">Ver Evento</a>
            </div>
        `;
    }

    setupPagination(page);
}

async function fetchCategories(eventId) {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/categories`);
    return response.json();
}

async function setupPagination(currentPage) {
    paginationContainer.innerHTML = ''; // Limpiar la paginación
    const totalPages = Math.ceil(totalEvents / eventsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;

        // Añadir el manejador de eventos
        pageLink.addEventListener('click', (event) => {
            event.preventDefault();  // Evitar que la página se recargue
            loadEvents(i);  // Llamar a la función loadEvents para la página correspondiente
        });

        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }
}

// Cargar eventos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await fetchEventCount();
    loadEvents(currentPage);
});

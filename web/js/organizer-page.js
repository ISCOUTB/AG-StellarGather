import { API_BASE_URL } from './config.js';

const eventsContainer = document.getElementById('events-container');
const paginationContainer = document.getElementById('pagination');
const organizerNameDisplay = document.getElementById('organizer-name-display');
const organizerNamePageHeader = document.getElementById('organizer-name');
const organizerInvitation = document.getElementById('organizer-invitation');
const organizerHeader = document.getElementById('organizer-header');
const eventsPerPage = 12;
let currentPage = 1;
let totalEvents = 0;
let organizerId = null;
let organizerName = "";

// Obtener el parámetro de la URL (organizer_id)
function getOrganizerIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('organizer_id'); // Obtener el id del organizador
}

// Obtener el nombre de la categoría
async function fetchOrganizerName(organizerId) {
    const response = await fetch(`${API_BASE_URL}/organizers/${organizerId}`);
    const organizer = await response.json();
    return organizer.name
}

// Obtener los eventos por organizador disponibles
async function fetchCountEventsByOrganizers() {
    const response = await fetch(`${API_BASE_URL}/events/count/by-organizer`);
    const countEventsByOrganizer = await response.json();
    return countEventsByOrganizer;
}

// Hacer la solicitud para obtener los eventos del país
async function fetchEventsByOrganizer(organizerId, page) {
    const response = await fetch(`${API_BASE_URL}/events/organizer/${organizerId}?page=${page}&limit=${eventsPerPage}`);
    const events = await response.json();
    return events;
}

// Obtener el número total de eventos por país
async function fetchEventCountByOrganizer(organizerId) {
    const response = await fetch(`${API_BASE_URL}/events/count/by-organizer/${organizerId}`);
    const data = await response.json();
    totalEvents = data.event_count;
}

// Configurar la paginación
async function setupPagination(organizerId, currentPage) {
    paginationContainer.innerHTML = ''; // Limpiar la paginación
    const totalPages = Math.ceil(totalEvents / eventsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;

        // Creamos el enlace de la página
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;

        // Añadimos el manejador de evento `click` para cada página
        pageLink.addEventListener('click', (event) => {
            event.preventDefault(); // Evitar que el enlace recargue la página
            loadEvents(organizerId, i);  // Llamamos a loadEvents con el número de la página correspondiente
        });

        // Agregamos el enlace al item de la página
        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }
}

// Mostrar los eventos en el contenedor
async function loadEvents(organizerId, page) {
    await fetchEventCountByOrganizer(organizerId);
    const events = await fetchEventsByOrganizer(organizerId, page);
    eventsContainer.innerHTML = '';

    for (const event of events) {
        const eventDate = new Date(event.date);
        const day = String(eventDate.getDate()).padStart(2, '0');
        const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

        const description = event.description && event.description.length > 70
            ? event.description.slice(0, 80) + '...'
            : event.description;

        eventsContainer.innerHTML += 
            `<div class="col-lg-4 col-md-6 mb-5">
                <div class="position-relative mb-4">
                    <img class="img-fluid rounded w-100" src="../img/event/${event.id}.webp" alt="">
                    <div class="blog-date">
                        <h4 class="font-weight-bold mb-n1 text-primary">${day}</h4>
                        <small class="text-white text-uppercase">${month}</small>
                    </div>
                </div>
                <h5 class="font-weight-medium mb-2">${event.name}</h5>
                <p class="mb-4">${description}</p>
                <a class="btn btn-sm btn-primary py-2" href="event.html?event_id=${event.id}">Ver Evento</a>
            </div>`;
    }

    setupPagination(organizerId, page);
}

// Mostrar los organizadores disponibles para seleccionar
function displayOrganizersSelection(organizers) {
    eventsContainer.innerHTML = ''; // Limpiar el contenedor de eventos
    organizerHeader.textContent = 'Selecciona un país'; // Cambiar el encabezado

    // Crear un contenedor con botones o enlaces para cada país
    const organizerList = document.createElement('ul');
    organizerList.className = 'list-unstyled';

    organizers.forEach(organizer => {
        const listItem = document.createElement('li');
        listItem.className = 'mb-3';

        const organizerButton = document.createElement('button');
        organizerButton.className = 'btn btn-outline-primary';
        organizerButton.textContent = `${organizer.organizer_name} (${organizer.event_count} eventos)`;
        organizerButton.onclick = () => {
            window.location.href = `?organizer_id=${organizer.id}`; // Redirigir a la página del organizador seleccionado
        };

        listItem.appendChild(organizerButton);
        organizerList.appendChild(listItem);
    });

    // Insertar la lista de categorías en el contenedor
    eventsContainer.appendChild(organizerList);
}

// Cargar eventos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    organizerId = getOrganizerIdFromUrl(); // Obtener el id del organizador desde la URL

    if (!organizerId) {
        // Si no hay organizer_id, mostrar los organizadores disponibles
        const organizers = await fetchCountEventsByOrganizers();
        displayOrganizersSelection(organizers); // Mostrar las categorías
    } else {
        // Si hay un organizer_id, proceder a cargar los eventos
        organizerName = await fetchOrganizerName(organizerId); // Obtener el nombre del organizador
        organizerNamePageHeader.textContent = organizerName; // Mostrar el nombre de la categoría en el encabezado
        organizerNameDisplay.textContent = organizerName; // Mostrar el nombre de la categoría
        organizerHeader.textContent = organizerName; // Mostrar el nombre de la categoría en el encabezado
        if (organizerInvitation) {
            organizerInvitation.textContent = `Explora los eventos de ${organizerName} que no querrás perderte. ¡Asegura tu lugar hoy mismo y vive una experiencia única!`;
        }
        await loadEvents(organizerId, currentPage); // Cargar los eventos de la categoría
    }
});

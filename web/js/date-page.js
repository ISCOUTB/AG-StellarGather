import { API_BASE_URL } from './config.js';

const eventsContainer = document.getElementById('events-container');
const paginationContainer = document.getElementById('pagination');
const dateNameDisplay = document.getElementById('date-name-display');
const dateNamePageHeader = document.getElementById('date-name');
const dateInvitation = document.getElementById('date-invitation');
const dateHeader = document.getElementById('date-header');
const eventsPerPage = 12;
let currentPage = 1;
let totalEvents = 0;    
let eventDate = null;

// Obtener el parámetro de la URL (event_date)
function getEventDateFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('event_date'); // Obtener la fecha del evento
}

// Función para formatear las fechas en el formato "15 Noviembre 2024"
function formatDate(dateString) {
    // Aseguramos que la fecha siempre tenga un formato completo (incluso si no se especifica hora)
    const dateObj = new Date(dateString + "T00:00:00"); // Asegura que no haya confusión con la zona horaria
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = dateObj.toLocaleString('es-ES', { month: 'long' });
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1);

    const year = dateObj.getFullYear();

    return `${day} ${formattedMonth} ${year}`;
}


// Obtener las fechas disponibles
async function fetchEventDates() {
    const response = await fetch(`${API_BASE_URL}/events/count/by-date`);
    const dates = await response.json();
    return dates;
}

// Hacer la solicitud para obtener los eventos de una fecha
async function fetchEventsByDate(eventDate, page) {
    const response = await fetch(`${API_BASE_URL}/events/date/${eventDate}?page=${page}&limit=${eventsPerPage}`);
    const events = await response.json();
    return events;
}

// Configurar la paginación
async function setupPagination(eventDate, currentPage) {
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
            loadEvents(eventDate, i);  // Llamamos a loadEvents con el número de la página correspondiente
        });

        // Agregamos el enlace al item de la página
        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }
}

// Mostrar los eventos en el contenedor
async function loadEvents(eventDate, page) {
    const events = await fetchEventsByDate(eventDate, page);
    eventsContainer.innerHTML = '';

    for (const event of events) {
        const eventDateObj = new Date(event.date);
        const day = String(eventDateObj.getDate()).padStart(2, '0');
        const month = eventDateObj.toLocaleString('default', { month: 'short' }).toUpperCase();

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

    setupPagination(eventDate, page);
}

// Mostrar las fechas disponibles para seleccionar
function displayDateSelection(dates) {
    eventsContainer.innerHTML = ''; // Limpiar el contenedor de eventos
    dateHeader.textContent = 'Selecciona una fecha'; // Cambiar el encabezado

    // Crear un contenedor con botones o enlaces para cada fecha
    const dateList = document.createElement('ul');
    dateList.className = 'list-unstyled';

    dates.forEach(date => {
        const listItem = document.createElement('li');
        listItem.className = 'mb-3';

        const formattedDate = formatDate(date.event_date); // Formatear la fecha

        const dateButton = document.createElement('button');
        dateButton.className = 'btn btn-outline-primary';
        dateButton.textContent = `${formattedDate} (${date.event_count} eventos)`;
        dateButton.onclick = () => {
            window.location.href = `?event_date=${date.event_date}`; // Redirigir a la página de la fecha seleccionada
        };

        listItem.appendChild(dateButton);
        dateList.appendChild(listItem);
    });

    // Insertar la lista de fechas en el contenedor
    eventsContainer.appendChild(dateList);
}

// Cargar eventos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    eventDate = getEventDateFromUrl(); // Obtener la fecha del evento desde la URL

    if (!eventDate) {
        // Si no hay event_date, mostrar las fechas disponibles
        const dates = await fetchEventDates();
        displayDateSelection(dates); // Mostrar las fechas
    } else {
        // Si hay un event_date, proceder a cargar los eventos
        const formattedDate = formatDate(eventDate); // Formatear la fecha
        dateNameDisplay.textContent = formattedDate; // Mostrar la fecha formateada en el encabezado
        dateNamePageHeader.textContent = `Eventos del ${formattedDate}`; // Mostrar la fecha formateada en el encabezado de la página
        dateHeader.textContent = formattedDate; // Cambiar el encabezado
        if (dateInvitation) {
            dateInvitation.textContent = `Descubre todos los eventos programados para el día ${formattedDate}. ¡No te los pierdas!`;
        }
        await loadEvents(eventDate, currentPage); // Cargar los eventos de la fecha seleccionada
    }
});

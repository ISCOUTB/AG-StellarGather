import { API_BASE_URL } from './config.js';

const eventsContainer = document.getElementById('events-container');
const paginationContainer = document.getElementById('pagination');
const countryNameDisplay = document.getElementById('country-name-display');
const countryNamePageHeader = document.getElementById('country-name');
const countryInvitation = document.getElementById('country-invitation');
const countryHeader = document.getElementById('country-header');
const eventsPerPage = 12;
let currentPage = 1;
let totalEvents = 0;    
let countryName = "";

// Obtener el parámetro de la URL (country_name)
function getCountryNameFromUrlL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('country_name'); // Obtener el nombre del país
}

// Obtener la cantidad de eventos por países
async function fetchCountEventsByCountries() {
    const response = await fetch(`${API_BASE_URL}/events/count/by-country`);
    const countEventsByCountry = await response.json();
    return countEventsByCountry;
}

// Hacer la solicitud para obtener los eventos del país
async function fetchEventsByCountry(countryName, page) {
    const response = await fetch(`${API_BASE_URL}/events/country/${countryName}?page=${page}&limit=${eventsPerPage}`);
    const events = await response.json();
    return events;
}

// Obtener el número total de eventos por país
async function fetchEventCountByCountry(countryName) {
    const response = await fetch(`${API_BASE_URL}/events/count/by-country/${countryName}`);
    const data = await response.json();
    totalEvents = data.event_count;
}

// Configurar la paginación
async function setupPagination(countryName, currentPage) {
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
            loadEvents(countryName, i);  // Llamamos a loadEvents con el número de la página correspondiente
        });

        // Agregamos el enlace al item de la página
        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }
}

// Mostrar los eventos en el contenedor
async function loadEvents(countryName, page) {
    await fetchEventCountByCountry(countryName);
    const events = await fetchEventsByCountry(countryName, page);
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

    setupPagination(countryName, page);
}

// Mostrar las categorías disponibles para seleccionar
function displayCountrySelection(countries) {
    eventsContainer.innerHTML = ''; // Limpiar el contenedor de eventos
    countryHeader.textContent = 'Selecciona un país'; // Cambiar el encabezado

    // Crear un contenedor con botones o enlaces para cada país
    const countryList = document.createElement('ul');
    countryList.className = 'list-unstyled';

    countries.forEach(country => {
        const listItem = document.createElement('li');
        listItem.className = 'mb-3';

        const countryButton = document.createElement('button');
        countryButton.className = 'btn btn-outline-primary';
        countryButton.textContent = `${country.country} (${country.event_count} eventos)`;
        countryButton.onclick = () => {
            window.location.href = `?country_name=${country.country}`; // Redirigir a la página del país seleccionado
        };

        listItem.appendChild(countryButton);
        countryList.appendChild(listItem);
    });

    // Insertar la lista de categorías en el contenedor
    eventsContainer.appendChild(countryList);
}

// Cargar eventos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    countryName = getCountryNameFromUrlL(); // Obtener el nombre del país desde la URL

    if (!countryName) {
        // Si no hay country_name, mostrar los países disponibles
        const countries = await fetchCountEventsByCountries();
        displayCountrySelection(countries); // Mostrar las categorías
    } else {
        // Si hay un country_name, proceder a cargar los eventos
        countryNamePageHeader.textContent = countryName; // Mostrar el nombre de la categoría en el encabezado
        countryNameDisplay.textContent = countryName; // Mostrar el nombre de la categoría
        countryHeader.textContent = countryName; // Mostrar el nombre de la categoría en el encabezado
        if (countryInvitation) {
            countryInvitation.textContent = `Explora los eventos en ${countryName} que no querrás perderte. ¡Asegura tu lugar hoy mismo y vive una experiencia única!`;
        }
        await loadEvents(countryName, currentPage); // Cargar los eventos de la categoría
    }
});

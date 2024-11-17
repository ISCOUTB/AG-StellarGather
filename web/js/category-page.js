import { API_BASE_URL } from './config.js';

const eventsContainer = document.getElementById('events-container');
const paginationContainer = document.getElementById('pagination');
const categoryNameDisplay = document.getElementById('category-name-display');
const categoryNamePageHeader = document.getElementById('category-name');
const categoryInvitation = document.getElementById('category-invitation');
const categoryHeader = document.getElementById('category-header');
const eventsPerPage = 12;
let currentPage = 1;
let totalEvents = 0;    
let categoryId = null;
let categoryName = "";

// Obtener el parámetro de la URL (category_id)
function getCategoryIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category_id'); // Obtener el ID de la categoría
}

// Obtener la cantidad de eventos por categorías
async function fetchCountEventsCategories() {
    const response = await fetch(`${API_BASE_URL}/categories/events/count`);
    const countEventsByCategory = await response.json();
    return countEventsByCategory;
}

// Hacer la solicitud para obtener los eventos de la categoría
async function fetchEventsByCategory(categoryId, page) {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/events?page=${page}&limit=${eventsPerPage}`);
    const events = await response.json();
    return events;
}

// Obtener el nombre de la categoría
async function fetchCategoryName(categoryId) {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`);
    const category = await response.json();
    return category.name;
}

// Obtener el número total de eventos por categoría
async function fetchEventCountByCategory(categoryId) {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/events-count`);
    const data = await response.json();
    totalEvents = data.event_count;
}

// Configurar la paginación
async function setupPagination(categoryId, currentPage) {
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
            loadEvents(categoryId, i);  // Llamamos a loadEvents con el número de la página correspondiente
        });

        // Agregamos el enlace al item de la página
        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }
}

// Mostrar los eventos en el contenedor
async function loadEvents(categoryId, page) {
    await fetchEventCountByCategory(categoryId);
    const events = await fetchEventsByCategory(categoryId, page);
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

    setupPagination(categoryId, page);
}

// Mostrar las categorías disponibles para seleccionar
function displayCategorySelection(categories) {
    eventsContainer.innerHTML = ''; // Limpiar el contenedor de eventos
    categoryHeader.textContent = 'Selecciona una categoría'; // Cambiar el encabezado

    // Crear un contenedor con botones o enlaces para cada categoría
    const categoryList = document.createElement('ul');
    categoryList.className = 'list-unstyled';

    categories.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'mb-3';

        const categoryButton = document.createElement('button');
        categoryButton.className = 'btn btn-outline-primary';
        categoryButton.textContent = `${category.name} (${category.event_count} eventos)`;
        categoryButton.onclick = () => {
            window.location.href = `?category_id=${category.id}`; // Redirigir a la página de la categoría seleccionada
        };

        listItem.appendChild(categoryButton);
        categoryList.appendChild(listItem);
    });

    // Insertar la lista de categorías en el contenedor
    eventsContainer.appendChild(categoryList);
}

// Cargar eventos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    categoryId = getCategoryIdFromUrl(); // Obtener el ID de la categoría desde la URL

    if (!categoryId) {
        // Si no hay category_id, mostrar las categorías disponibles
        const categories = await fetchCountEventsCategories();
        displayCategorySelection(categories); // Mostrar las categorías
    } else {
        // Si hay un category_id, proceder a cargar los eventos
        categoryName = await fetchCategoryName(categoryId); // Obtener el nombre de la categoría
        categoryNamePageHeader.textContent = categoryName; // Mostrar el nombre de la categoría en el encabezado
        categoryNameDisplay.textContent = categoryName; // Mostrar el nombre de la categoría
        categoryHeader.textContent = categoryName; // Mostrar el nombre de la categoría en el encabezado
        if (categoryInvitation) {
            categoryInvitation.textContent = `Explora los eventos en ${categoryName} que no querrás perderte. ¡Asegura tu lugar hoy mismo y vive una experiencia única!`;
        }
        await loadEvents(categoryId, currentPage); // Cargar los eventos de la categoría
    }
});

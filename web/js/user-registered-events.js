import { API_BASE_URL } from './config.js';
import { createSuccessModal, createErrorModal } from './modals.js';

const eventsContainer = document.getElementById('events-container');
const paginationContainer = document.getElementById('pagination');
const eventsPerPage = 12;
let currentPage = 1;
let totalEvents = 0;
const userId = localStorage.getItem('user_id');

async function fetchEvents(page) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/registration-events?page=${page}&limit=${eventsPerPage}`);
    const events = await response.json();
    return events;
}

async function fetchEventCount() {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/registrations-count`);
    const data = await response.json();
    totalEvents = data.registration_count;
}

async function loadEvents(page) {
    const events = await fetchEvents(page);
    eventsContainer.innerHTML = '';
    const currentDate = new Date();

    for (const event of events) {
        const categories = await fetchCategories(event.event_id);
        const categoriesHtml = categories.map((cat, index) => {
            const separator = index > 0 ? `<span class="text-primary px-2">|</span>` : '';
            return `${separator}<a class="text-secondary text-uppercase font-weight-medium" href="">${cat.name}</a>`;
        }).join('');

        const eventDate = new Date(event.event_date);
        const day = String(eventDate.getDate()).padStart(2, '0');
        const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
        const registrationDate = new Date(event.registration_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const location = event.location;
        const time = new Date(event.event_date).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const price = parseFloat(event.price).toFixed(2);
        const displayPrice = parseFloat(price) === 0 ? 'Gratis' : `$${price}`;

        // Cálculos para habilitar cancelación
        const timeDifference = eventDate - currentDate;
        const hoursDifference = timeDifference / (1000 * 60 * 60);
        const canCancel = hoursDifference > 24;

        const { statusHtml, registrationMessage, cancelButtonClass } = generateEventStatusHtml(event, currentDate, registrationDate, canCancel);

        eventsContainer.innerHTML += `
            <div class="col-lg-4 col-md-6 mb-5">
                <div class="position-relative mb-4">
                    <img class="img-fluid rounded w-100" src="img/event/${event.event_id}.webp" alt="">
                    ${statusHtml}
                    <div class="blog-date">
                        <h4 class="font-weight-bold mb-n1 text-primary">${day}</h4>
                        <small class="text-white text-uppercase">${month}</small>
                    </div>
                </div>
                <div class="d-flex mb-2">${categoriesHtml}</div>
                <h5 class="font-weight-medium mb-2">${event.name}</h5>
                <p class="mb-3">${registrationMessage}</p>
                <div class="d-flex mb-3 align-items-center">
                    <i class="fas fa-map-marker-alt text-secondary mr-2"></i>
                    <span class="font-weight-medium">Lugar: <strong id="event-location">${location}</strong></span>
                </div>
                <div class="d-flex mb-3 align-items-center">
                    <i class="fas fa-clock text-secondary mr-2"></i>
                    <span class="font-weight-medium">Hora: <strong id="event-time">${time}</strong></span>
                </div>                        
                <div class="d-flex mb-3 align-items-center">
                    <i class="fas fa-dollar-sign text-secondary mr-2"></i>
                    <span class="font-weight-medium">Precio: <strong id="event-price">${displayPrice}</strong></span>
                </div>
                <div class="d-flex justify-content-center mb-3">
                    <a class="btn btn-sm btn-primary mr-3 py-2" href="events/event.html?event_id=${event.event_id}">Ver Evento</a>
                    <a class="btn btn-sm btn-secondary py-2 ${cancelButtonClass}" href="#" onclick="handleCancelRegistration(event, '${event.registration_id}', '${event.status}', '${event.event_id}') ">Cancelar Registro</a>
                </div>
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

        // Creamos el enlace de la página
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;

        // Añadimos el manejador de evento `click` para cada página
        pageLink.addEventListener('click', (event) => {
            event.preventDefault(); // Evitar que el enlace recargue la página
            loadEvents(i);  // Llamamos a loadEvents con el número de la página correspondiente
        });

        // Agregamos el enlace al item de la página
        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
    }
}


// Cargar eventos al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await fetchEventCount();
    loadEvents(currentPage);
});
function createConfirmationModal(registrationId, eventId) {
    async function fetchEventDetails(eventId) {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        return response.json();
    }

    fetchEventDetails(eventId).then(eventDetails => {
        const eventName = eventDetails.name;
        const eventTime = new Date(eventDetails.date).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const modalHtml = `
            <div class="modal fade" id="confirmationModal" tabindex="-1" role="dialog" aria-labelledby="confirmationModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="confirmationModalLabel"><i class="fas fa-exclamation-triangle"></i> Confirmación</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p><i class="fas fa-question-circle"></i> ¿Está seguro de que desea cancelar su registro para el evento <strong>${eventName}</strong> en <strong>${eventDetails.location}, ${eventDetails.city}, ${eventDetails.country}</strong> a las <strong>${eventTime}*</strong>? (Hora local del evento)</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-danger" id="confirmCancel">Confirmar Cancelación</button>
                        </div>
                    </div>
                </div>
            </div>`;

        // Insertar el modal en el cuerpo de la página
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar el modal con Bootstrap 4
        $('#confirmationModal').modal('show');

        // Agregar un manejador para el botón de confirmación
        document.getElementById('confirmCancel').addEventListener('click', function() {
            cancelRegistration(registrationId); // Llama a la función para cancelar el registro
            $('#confirmationModal').modal('hide');
        });

        // Remover el modal después de que se cierre
        $('#confirmationModal').on('hidden.bs.modal', function () {
            $(this).remove();
        });
    });
}

function generateEventStatusHtml(event, currentDate, registrationDate, canCancel) {
    let statusHtml = '';
    let registrationMessage = '';
    let cancelButtonClass = '';

    const eventDate = new Date(event.event_date);
    const isEventPast = eventDate < currentDate;

    if (isEventPast && event.status === 'registered') {
        statusHtml = `<div class="blog-status blog-status-registered-with-done">
                        <small class="text-white text-uppercase">Registrado</small> 
                    </div>`;
        registrationMessage = `Te registraste para este evento el día ${registrationDate}.`;
        cancelButtonClass = 'disabled';
    } else if (isEventPast && event.status === 'canceled') {
        statusHtml = `<div class="blog-status blog-status-canceled-with-done">
                        <small class="text-white text-uppercase">Cancelado</small>
                        </div>`;
        registrationMessage = `Has cancelado el registro a este evento y no podrás asistir a él.`;
        cancelButtonClass = 'disabled';
    } else if (!isEventPast && event.status === 'registered') {
        statusHtml = `<div class="blog-status blog-status-registered">
                        <small class="text-white text-uppercase">Registrado</small> 
                        </div>`;
        registrationMessage = `Te has registrado a este evento el día ${registrationDate}.`;
        cancelButtonClass = canCancel ? '' : 'disabled';
    } else {
        statusHtml = `<div class="blog-status blog-status-canceled">
                        <small class="text-white text-uppercase">Cancelado</small>
                        </div>`;
        registrationMessage = `Has cancelado el registro a este evento y no podrás asistir a él.`;
        cancelButtonClass = 'disabled';
    }

    return { statusHtml, registrationMessage, cancelButtonClass };
}

window.handleCancelRegistration = function(event, registrationId, status, eventId) {
    event.preventDefault(); // Previene el comportamiento predeterminado del enlace
    if (status === 'registered') {
        createConfirmationModal(registrationId, eventId);
    } else {
        // Aquí podrías agregar lógica adicional si fuera necesario
    }
}


function cancelRegistration(registrationId) {
    fetch(`${API_BASE_URL}/registrations/${registrationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al cancelar el registro');
        }
        return response.json();
    })
    .then(data => {
        console.log('Registro cancelado', data);
        createSuccessModal('Registro cancelado con éxito.');
        loadEvents(currentPage); // Recargar eventos para reflejar el cambio
    })
    .catch(error => {
        console.error(error);
        createErrorModal('Error' , 'Error al cancelar el registro. Inténtalo de nuevo más tarde.');
    });
}

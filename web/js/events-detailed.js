import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function () {
    loadEventDetailed();
});

function loadEventDetailed() {
    // Obtener el parámetro 'id' de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');
    if (!eventId) {
        window.location.href = '../events.html';
        return;
    }

    let event;

    // Hacer la solicitud para obtener los detalles del evento
    fetch(`${API_BASE_URL}/events/${eventId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Evento no encontrado');
            }
            return response.json();
        })
        .then(data => {
            event = data;

            // Llenar el HTML con la información del evento
            document.getElementById('title-bread').innerText = `Evento #${event.id}`;
            document.getElementById('id-bread-event').innerText = `Evento #${event.id}`;
            document.getElementById('event-name').innerText = event.name;
            const introductionDetailsDiv = document.getElementById('introduction-details');
            let eventImage = document.querySelector('#introduction-details img');
            if (!eventImage) {
                eventImage = document.createElement('img');
                eventImage.className = 'img-fluid rounded w-50 float-left mr-4 mb-3';
                eventImage.src = `../img/event/${event.id}.webp`;
                eventImage.alt = 'Image';
            }
            introductionDetailsDiv.insertBefore(eventImage, introductionDetailsDiv.firstChild);
            document.getElementById('event-description').innerText = event.description;
            document.getElementById('event-location').innerText = `${event.location}, ${event.city}, ${event.country}`;
            document.getElementById('event-date').innerText = new Date(event.date).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            }) + '*';
            const eventDateTime = new Date(event.date);
            const options = { hour: '2-digit', minute: '2-digit', hour12: false };
            document.getElementById('event-time').innerText = eventDateTime.toLocaleTimeString('es-ES', options) + '*';     
            document.getElementById('event-capacity').innerText = `${event.max_capacity} asistentes`;

            // Hacer una solicitud para obtener las inscripciones
            return fetch(`${API_BASE_URL}/events/${eventId}/registrations`);
        })
        .then(response => {
            if (!response.ok) {
            return { available_slots: 0 };
            }
            return response.json();
        })
        .then(registrations => {
            // Actualizar el HTML con los asientos disponibles
            document.getElementById('event-available').innerText = registrations.available_slots;
            document.getElementById('event-price').innerText = event.price === 0 ? 'Gratis' : `$${event.price}`;

            // Verificar si el usuario ya está registrado
            const userId = localStorage.getItem('user_id');
            fetch(`${API_BASE_URL}/registrations/check/${userId}/${eventId}`)
                .then(response => {
                    if (!response.ok) {
                        return response.status === 404 ? false : false;
                    }
                    // Si la respuesta es 'OK', asumimos que el usuario está registrado
                    return true;
                })     
                .then(isRegistered => {
                    // Actualizar el botón de registro
                    const registerButtonDiv = document.getElementById('register-button');
                    if (isRegistered) {
                        registerButtonDiv.innerHTML = 
                        `<button class="btn btn-secondary btn-lg mr-2 disabled">Ya estás registrado</button> 
                        <a href="../my-registers.html" class="btn btn-primary btn-lg mt-2 mt-md-0">Ver Mis Registros</a>`;
                    } else {
                        registerButtonDiv.innerHTML = `<a href="#" class="btn btn-secondary btn-lg" id="register-now">Registrarme Ahora</a>`;
                        
                        // Asignar el evento de clic programáticamente
                        const registerNowButton = document.getElementById('register-now');
                        registerNowButton.addEventListener('click', function(event) {
                            handleRegisterEvent(event, eventId);
                        });
                    }
                })
                .catch(error => {
                    const registerButtonDiv = document.getElementById('register-button');
                    // En caso de error, asumimos que no está registrado
                    registerButtonDiv.innerHTML = `<a href="#" class="btn btn-secondary btn-lg" id="register-now">Registrarme Ahora</a>`;
                    
                    // Asignar el evento de clic programáticamente
                    const registerNowButton = document.getElementById('register-now');
                    registerNowButton.addEventListener('click', function(event) {
                        handleRegisterEvent(event, eventId);
                    });
                });

            // Continuar con la solicitud de categorías y otros detalles...
            return fetch(`${API_BASE_URL}/events/${eventId}/categories`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('No se encontraron categorías para este evento');
            }
            return response.json();
        })
        .then(categories => {
            const categoriesDiv = document.querySelector('.d-flex.mb-2');
            categoriesDiv.innerHTML = ''; // Limpiar contenido previo

            if (categories.length > 0) {
                categories.forEach((category, index) => {
                    const categoryLink = document.createElement('a');
                    categoryLink.className = 'text-secondary text-uppercase font-weight-medium';
                    categoryLink.href = `category.html?category_id=${category.id}`;
                    categoryLink.innerText = category.name;

                    categoriesDiv.appendChild(categoryLink);

                    // Añadir separador si no es la última categoría
                    if (index < categories.length - 1) {
                        const separator = document.createElement('span');
                        separator.className = 'text-primary px-2';
                        separator.innerText = '|';
                        categoriesDiv.appendChild(separator);
                    }
                });

                const separator = document.createElement('span');
                separator.className = 'text-primary px-2';
                separator.innerText = '|';
                categoriesDiv.appendChild(separator);

                // Agregar la fecha del evento al final en el formato deseado
                const formattedDate = new Date(event.date).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: '2-digit'
                });

                const dateLink = document.createElement('a');
                dateLink.className = 'text-secondary text-uppercase font-weight-medium';
                const eventDateLink = new Date(event.date);
                const formattedEventDateLink = eventDateLink.toISOString().split('T')[0];
                dateLink.href = `date.html?event_date=${formattedEventDateLink}`;
                dateLink.innerText = formattedDate;

                categoriesDiv.appendChild(dateLink);
            } else {
                categoriesDiv.innerText = 'Sin categorías disponibles';
            }

            // Hacer una solicitud para obtener la información del organizador
            return fetch(`${API_BASE_URL}/organizers/${event.organizer_id}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Organizador no encontrado');
            }
            return response.json();
        })
        .then(organizer => {
            const organizerDiv = document.getElementById('organizer-info');
            organizerDiv.innerHTML = `
                <img src="../img/organizer/${organizer.id}.webp" class="img-fluid rounded-circle mx-auto mb-3" style="width: 100px;">
                <h3 class="text-white mb-3">${organizer.name}</h3>
                <div class="d-flex justify-content-center mb-3 align-items-center">
                    <i class="fas fa-envelope text-primary mr-2"></i>
                    <span class="font-weight-medium text-white email">${organizer.email}</span>
                </div>
                <div class="d-flex justify-content-center align-items-center">
                    <i class="fas fa-phone text-primary mr-2"></i>
                    <span class="font-weight-medium text-white phone">${organizer.phone}</span>
                </div>
            `;
        })
        .catch(error => {
            createErrorModal('Error en la solicitud', error.message, '../contacto.html');
        });

    // Solicitud para obtener las categorías con más eventos para el sidebar
    fetch(`${API_BASE_URL}/categories/events/count`)
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudieron obtener las categorías populares');
            }
            return response.json();
        })
        .then(popularCategories => {
            const sidebarDiv = document.getElementById('sidebar-categories');
            sidebarDiv.innerHTML = '';

            const topCategories = popularCategories.slice(0, 5);

            topCategories.forEach(category => {
                const listItem = document.createElement('li');
                listItem.className = 'mb-1 py-2 px-3 bg-light d-flex justify-content-between align-items-center';
                
                const categoryLink = document.createElement('a');
                categoryLink.className = 'text-dark';
                categoryLink.href = `category.html?category_id=${category.id}`;
                categoryLink.innerHTML = `<i class="fa fa-angle-right text-secondary mr-2"></i>${category.name}`;
                
                const badge = document.createElement('span');
                badge.className = 'badge badge-primary badge-pill';
                badge.innerText = category.event_count;

                listItem.appendChild(categoryLink);
                listItem.appendChild(badge);
                sidebarDiv.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error en el sidebar:', error);
        });

    // Solicitud para obtener los eventos próximos
    fetch(`${API_BASE_URL}/upcoming-events`)
        .then(response => {
            if (!response.ok) {
                throw new Error('No se encontraron eventos próximos');
            }
            return response.json();
        })
        .then(events => {
            const upcomingEventsContainer = document.getElementById('upcoming-events-container');
            upcomingEventsContainer.innerHTML = '';

            const topEvents = events.slice(0, 5);

            topEvents.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'd-flex align-items-center border-bottom mb-3 pb-3';

                const eventImage = document.createElement('img');
                eventImage.className = 'img-fluid rounded';
                eventImage.src = `../img/event/${event.id}.webp`;
                eventImage.style.width = '80px';
                eventImage.style.height = '80px';
                eventImage.style.objectFit = 'cover';
                eventImage.alt = '';

                const textDiv = document.createElement('div');
                textDiv.className = 'd-flex flex-column pl-3';

                const eventLink = document.createElement('a');
                eventLink.className = 'text-dark mb-2';
                eventLink.href = '';
                eventLink.innerText = event.name;

                textDiv.appendChild(eventLink);

                fetch(`${API_BASE_URL}/events/${event.id}/categories`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('No se encontraron categorías para este evento');
                        }
                        return response.json();
                    })
                    .then(categories => {
                        const categoryContainer = document.createElement('div');
                        categoryContainer.className = 'd-flex';

                        if (categories.length > 0) {
                            categories.forEach((category, index) => {
                                const categoryLink = document.createElement('small');
                                categoryLink.innerHTML = `<a class="text-secondary text-uppercase font-weight-medium" href="category.html?category_id=${category.id}">${category.name}</a>`;
                                categoryContainer.appendChild(categoryLink);

                                if (index < categories.length - 1) {
                                    const separator = document.createElement('small');
                                    separator.className = 'text-primary px-2';
                                    separator.innerText = '|';
                                    categoryContainer.appendChild(separator);
                                }
                            });
                        } else {
                            const noCategory = document.createElement('small');
                            noCategory.innerHTML = '<a class="text-secondary text-uppercase font-weight-medium" href="">Sin categorías</a>';
                            categoryContainer.appendChild(noCategory);
                        }

                        textDiv.appendChild(categoryContainer);
                    })
                    .catch(error => {
                        console.error('Error al obtener categorías:', error);
                    });

                eventDiv.appendChild(eventImage);
                eventDiv.appendChild(textDiv);
                upcomingEventsContainer.appendChild(eventDiv);
            });
        })
        .catch(error => {
            console.error('Error en la solicitud de eventos:', error);
        });

}

async function createRegistrationModal(eventId) {
    const modalHtml = `
        <div class="modal fade" id="registrationModal" tabindex="-1" role="dialog" aria-labelledby="registrationModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="registrationModalLabel"><i class="fas fa-check-circle"></i> Registro de Evento</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>¿Está seguro de que desea registrarse para este evento?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="confirmRegister">Confirmar Registro</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const registrationModal = new bootstrap.Modal(document.getElementById('registrationModal'));
    registrationModal.show();
    document.getElementById('registrationModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });

    // Lógica para confirmar el registro
    document.getElementById('confirmRegister').addEventListener('click', function() {
        registerForEvent(eventId); // Llama a la función para registrarse
        registrationModal.hide();
    });
}

function registerForEvent(eventId) {
    const userId = localStorage.getItem('user_id');
    fetch(`${API_BASE_URL}/registrations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, event_id: eventId })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                // Si la respuesta es un error, lanza un error con el detalle de la API
                throw new Error(errorData.detail || 'Error desconocido');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Registro exitoso', data);

        // Obtener los detalles del evento para mostrar en el modal
        return fetch(`${API_BASE_URL}/events/${eventId}`);
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener detalles del evento');
        }
        return response.json();
    })
    .then(eventDetails => {
        createSuccessModal(eventDetails);
        loadEventDetailed();
    })
    .catch(error => {
        createErrorModal('Error en la solicitud', error.message, '../contacto.html');
    });
}

function createLoginAlertModal() {
    const currentUrl = window.location.pathname;
    const currentParams = window.location.search;
    const modalHtml = `
        <div class="modal fade" id="loginAlertModal" tabindex="-1" role="dialog" aria-labelledby="loginAlertModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="loginAlertModalLabel"><i class="fas fa-exclamation-circle"></i> Atención</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p><i class="fas fa-info-circle"></i> Debe estar logueado para registrarse en un evento. Por favor, inicie sesión.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                        <a href="../login.html?redirect=${encodeURIComponent(currentUrl)}${encodeURIComponent(currentParams)}"" class="btn btn-primary">Iniciar Sesión</a>
                    </div>
                </div>
            </div>
        </div>`;

    // Insertar el modal en el cuerpo de la página
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar el modal con Bootstrap 4
    $('#loginAlertModal').modal('show');

    // Remover el modal después de que se cierre
    $('#loginAlertModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

function createSuccessModal(eventDetails) {
    const modalHtml = `
        <div class="modal fade" id="successModal" tabindex="-1" role="dialog" aria-labelledby="successModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="successModalLabel"><i class="fas fa-check-circle"></i> Registro Exitoso</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Te has registrado con éxito para el evento:</p>
                        <h5>${eventDetails.name}</h5>
                        <p><strong>Lugar:</strong> ${eventDetails.location}</p>
                        <p><strong>Fecha:</strong> ${new Date(eventDetails.date).toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                        <p><strong>Hora:</strong> ${new Date(eventDetails.date).toLocaleTimeString('es-ES', {
                            hour: '2-digit', minute: '2-digit', hour12: false
                        })}</p>
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


function handleRegisterEvent(event, eventId) {
    event.preventDefault();
    const isLoggedIn = localStorage.getItem('authToken'); // Verifica si está logueado
    if (isLoggedIn) {
        createRegistrationModal(eventId); // Si está logueado, abre el modal de registro
    } else {
        createLoginAlertModal(); // Si no está logueado, muestra el modal de alerta
    }
}

import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', getCommentsSection);

let currentPage = 1;
const commentsPerPage = 20;

async function getCommentsSection() {
    const urlParts = window.location.pathname.split('/');
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event_id');

    const commentsContainer = document.getElementById('comments-container');
    const commentsTitle = document.getElementById('comments-title');
    const commentSection = document.getElementById('comment-section');
    const eventDetailsContainer = document.getElementById('event-details');
    
    try {
        // Obtener los comentarios para la página actual
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/feedbacks?page=${currentPage}&limit=${commentsPerPage}`);
        if (!response.ok) throw new Error('No comments found');

        const feedbacks = await response.json();
        const totalComments = feedbacks.length;

        // Actualizar el título con el número total de comentarios
        commentsTitle.textContent = `${totalComments} Comentario${totalComments !== 1 ? 's' : ''}`;

        const userPromises = feedbacks.map(async feedback => {
            const userResponse = await fetch(`${API_BASE_URL}/users/${feedback.user_id}`);
            if (!userResponse.ok) throw new Error('Usuario no encontrado');
            const user = await userResponse.json();
            return { user, feedback };
        });

        const results = await Promise.all(userPromises);
        results.forEach(({ user, feedback }) => {
            const commentHTML = `
                <div class="media mb-4">
                    <img src="../img/user/${feedback.user_id}.webp" alt="Image" class="img-fluid rounded-circle mr-3 mt-1" style="width: 45px;">
                    <div class="media-body">
                        <h6>${user.full_name} <small><i>${formatDateToLocal(feedback.timestamp)}</i></small></h6>
                        <span class="ml-2 text-warning">
                            ${'★'.repeat(feedback.rating_value)}${'☆'.repeat(5 - feedback.rating_value)}
                        </span>
                        <p>${feedback.comment_text}</p>
                    </div>
                </div>`;
            commentsContainer.innerHTML += commentHTML;
        });

        // Eliminar el botón "Cargar más comentarios" si ya está presente
        const existingLoadMoreButton = document.getElementById('load-more-comments');
        if (existingLoadMoreButton) {
            existingLoadMoreButton.remove();
        }

        // Si hay más comentarios para cargar, creamos y mostramos el botón
        if (feedbacks.length === commentsPerPage) {
            const loadMoreButton = document.createElement('button');
            loadMoreButton.id = 'load-more-comments';
            loadMoreButton.classList.add('btn', 'btn-primary', 'mt-3');
            loadMoreButton.textContent = 'Cargar más comentarios';
            loadMoreButton.addEventListener('click', function() {
                currentPage++;
                getCommentsSection();
            });
            commentsContainer.appendChild(loadMoreButton);
        }

    } catch (error) {
        if (error.message === 'No comments found') {
            commentsContainer.innerHTML = '<p>No hay comentarios aún. ¡Sé el primero en comentar!</p>';
        } else {
            commentsContainer.innerHTML = '<p>Ha ocurrido un error al cargar los comentarios.</p>';
        }
    }

    // Verificar si el usuario está logueado
    const isLoggedIn = localStorage.getItem('authToken');
    const currentUrl = window.location.pathname;

    if (isLoggedIn) {
        commentSection.innerHTML = `
        <form id="comment-form">
            <div class="form-group">
                <label for="rating">Calificación *</label>
                <div id="rating" class="stars" style="font-size: 1.5rem;">
                    <span class="star" data-value="1">&#9733;</span>
                    <span class="star" data-value="2">&#9733;</span>
                    <span class="star" data-value="3">&#9733;</span>
                    <span class="star" data-value="4">&#9733;</span>
                    <span class="star" data-value="5">&#9733;</span>
                </div>
                <input type="hidden" id="rating-value" value="0">
            </div>
            <div class="form-group">
                <label for="message">Mensaje *</label>
                <textarea id="message" cols="30" rows="5" class="form-control"></textarea>
            </div>

            <div class="form-group mb-0">
                <input type="submit" value="Dejar Comentario" class="btn btn-primary">
            </div>
        </form>`;

        // Manejo de la interacción de las estrellas
        const stars = document.querySelectorAll('.star');
        const ratingInput = document.getElementById('rating-value');

        stars.forEach(star => {
            star.addEventListener('mouseover', function() {
                const value = parseInt(star.getAttribute('data-value'));
                updateStars(value);
            });
            star.addEventListener('mouseout', function() {
                const currentValue = parseInt(ratingInput.value);
                updateStars(currentValue);
            });
            star.addEventListener('click', function() {
                const value = parseInt(star.getAttribute('data-value'));
                ratingInput.value = value;
            });
        });

        // Actualiza las estrellas según el valor
        function updateStars(value) {
            stars.forEach(star => {
                const starValue = parseInt(star.getAttribute('data-value'));
                if (starValue <= value) {
                    star.style.color = 'gold';
                } else {
                    star.style.color = 'gray';
                }
            });
        }

        // Manejo del envío del formulario
        const form = document.getElementById('comment-form');
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const commentText = document.getElementById('message').value;
            const ratingValue = parseInt(ratingInput.value);

            if (!commentText || ratingValue < 1 || ratingValue > 5) {
                alert("Por favor, ingrese un comentario y seleccione una calificación.");
                return;
            }

            const feedbackData = {
                user_id: localStorage.getItem('user_id'),
                event_id: eventId,
                comment_text: commentText,
                rating_value: ratingValue
            };

            try {
                const response = await fetch(`${API_BASE_URL}/feedbacks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(feedbackData)
                });

                if (!response.ok) {
                    throw new Error('No se pudo enviar el comentario');
                }

                // Limpiar el formulario después de enviar
                document.getElementById('message').value = '';
                ratingInput.value = '0';
                updateStars(0);
            
                // Limpiar los comentarios actuales
                commentsContainer.innerHTML = '';

                // Recargar los comentarios
                currentPage = 1;
                getCommentsSection();

                // Desplazar hacia el inicio de la sección de comentarios
                eventDetailsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (error) {
                alert("Hubo un error al enviar el comentario: " + error.message);
            }
        });

    } else {
        commentSection.innerHTML = `
        <p>Para dejar un comentario en el evento, debes iniciar sesión.</p>
        <div class="text-center">
            <a href="../login.html?redirect=${encodeURIComponent(currentUrl)}" class="btn btn-primary">Iniciar sesión</a>
        </div>`;
    }

    function formatDateToLocal(utcDate) {
        // Crear un objeto Date a partir de la fecha UTC
        const date = new Date(utcDate);

        // Obtener la fecha y hora en la zona horaria local
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

        // Obtener el día, mes, año, hora, minutos, segundos y AM/PM
        const day = localDate.getDate();
        const month = localDate.getMonth() + 1;  // Los meses en JavaScript son 0-indexados (0 = enero)
        const year = localDate.getFullYear();
        
        let hours = localDate.getHours();
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const seconds = String(localDate.getSeconds()).padStart(2, '0');
    
        // Determinar AM o PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;  // La hora '0' debe ser '12'
        
        // Obtener la diferencia horaria en minutos y convertirla a formato GMT+/-número
        const timezoneOffset = localDate.getTimezoneOffset();
        const sign = timezoneOffset > 0 ? '-' : '+';
        const offset = Math.abs(timezoneOffset / 60);  // Convertir a horas
        const gmt = ` GMT${sign}${String(offset).padStart(2, '0')}`;
    
        // Formato final: d/m/yyyy, h:mm:ss AM/PM GMT+/-número
        return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}${gmt}`;
    }
}

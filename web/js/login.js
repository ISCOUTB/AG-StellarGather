import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Función para manejar el login
    document.getElementById('login-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) throw new Error('Error en el inicio de sesión. Verifica tus credenciales.');

            const data = await response.json();

            // Guarda el token de autenticación si se provee
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user_id', data.user_id);

            createSuccessModal('¡Inicio de sesión exitoso! Redirigiendo en breves'); // Modal de éxito

            // Redirige después de 4 segundos
            setTimeout(() => {
                // Redirige a la página original
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect') || '/';
                window.location.href = redirectUrl;
            }, 4000);

        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            createErrorModal('Credenciales incorrectas', 'Por favor, verifica y vuelve a intentar.'); // Modal de error
        }
    });
});

function validateUsername(username) {
    return username.length >= 3;
}

function validatePassword(password) {
    return password.length >= 6;
}

document.addEventListener('DOMContentLoaded', () => {
    // Validación para el login
    document.getElementById('login-form')?.addEventListener('input', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitButton = document.querySelector('.btn');

        // Validar correo y contraseña
        if (validateUsername(username) && validatePassword(password)) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    });
});

// Modales de éxito y error
function createSuccessModal(message) {
    const modalHtml = `
        <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="successModalLabel"><i class="fas fa-check-circle"></i> Acción Exitosa</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
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
        <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="errorModalLabel"><i class="fas fa-exclamation-circle"></i> ${title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"></button>
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

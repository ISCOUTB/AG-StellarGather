import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Función para manejar el registro
    document.getElementById('register-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const termsCheckbox = document.querySelector('input[type="checkbox"]');
        if (!termsCheckbox.checked) {
            createErrorModal('Error', 'Debes aceptar los términos y condiciones.');
            return;
        }

        const username = document.getElementById('username').value;
        const full_name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validar contraseña
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            createErrorModal('Error en la contraseña', passwordValidation.messages.join('<br>'));
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, full_name}),
            });

            if (!response.ok) throw new Error('Error en el registro. Intenta nuevamente.');

            createSuccessModal('¡Registro completado con éxito! Inicia sesión para confirmar. Será redirigido en 5 segundos.');

            // Redirigir después de 5 segundos
            setTimeout(() => {
                window.location.href = 'login.html'; 
            }, 5000); // 5000 ms = 5 segundos
        } catch (error) {
            console.error('Error en el registro:', error);
            createErrorModal('Error', 'Hubo un problema al registrar. Por favor, verifica tus datos.');
        }
    });
});

// Función para validar la contraseña
function validatePassword(password) {
    const minLength = 8;
    const errors = [];

    // Verificar la longitud mínima
    if (password.length < minLength) {
        errors.push('La contraseña debe tener al menos 8 caracteres.');
    }
    // Verificar la presencia de mayúsculas
    if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe incluir al menos una letra mayúscula.');
    }
    // Verificar la presencia de minúsculas
    if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe incluir al menos una letra minúscula.');
    }
    // Verificar la presencia de números
    if (!/\d/.test(password)) {
        errors.push('La contraseña debe incluir al menos un número.');
    }
    // Verificar la presencia de símbolos especiales
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('La contraseña debe incluir al menos un símbolo especial.');
    }

    // Si hay errores, devolvemos los errores encontrados
    if (errors.length > 0) {
        return {
            isValid: false,
            messages: errors // Devolvemos un array de errores
        };
    }

    // Si la contraseña es válida
    return {
        isValid: true,
        messages: []
    };
}

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

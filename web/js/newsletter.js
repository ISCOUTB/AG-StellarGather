import { NO_SQL_API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function () {
    const subscribeBtn = document.getElementById('subscribeBtn');

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', async function(event) {
            // Prevenir el comportamiento por defecto del enlace
            event.preventDefault();

            const emailInput = document.getElementById('email');
            const email = emailInput.value.trim();

            if (!email) {
                createErrorModal("Error", "Por favor, ingresa una dirección de correo electrónico.");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                createErrorModal("Error", "Por favor, ingresa una dirección de correo electrónico válida.");
                return;
            }

            try {
                const response = await fetch(`${NO_SQL_API_BASE_URL}/newsletter`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    createErrorModal("Error", errorData.detail || "Ocurrió un error al suscribirse.");
                    return;
                }

                createSuccessModal("¡Te has suscrito con éxito al boletín! Gracias por unirte.");
                document.getElementById('emailInput').value = '';
            } catch (error) {
                createErrorModal("Error", "Ocurrió un error al procesar la solicitud.");
            }
        });
    }
});


// Modales de éxito y error
function createSuccessModal(message) {
    const modalHtml = `
        <div class="modal fade" id="successModal" tabindex="-1" role="dialog" aria-labelledby="successModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="successModalLabel"><i class="fas fa-check-circle"></i> Acción Exitosa</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
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

import { NO_SQL_API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function () {
    // Obtén el formulario
    const contactForm = document.getElementById('contactForm');
    
    // Evento de envío del formulario
    contactForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        
        // Obtén los valores de los campos
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        // Validar si todos los campos están completos
        if (!name || !email || !subject || !message) {
            createErrorModal('Campos incompletos', 'Por favor, asegúrate de completar todos los campos.');
            return; // Detener el envío si hay campos vacíos
        }
        
        // Validar el formato del email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            createErrorModal('Correo electrónico inválido', 'Por favor, ingresa un correo electrónico válido.');
            return; // Detener el envío si el email no es válido
        }
        
        // Crea el objeto con los datos del formulario
        const contactData = {
            name: name,
            email: email,
            subject: subject,
            message: message
        };
        
        try {
            // Enviar la solicitud al backend
            const response = await fetch(`${NO_SQL_API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (response.ok) {
                // Si la respuesta es exitosa
                createSuccessModal('Gracias por tu mensaje, nos pondremos en contacto contigo pronto.');
                // Reiniciar el formulario
                contactForm.reset();
            } else {
                // Si la respuesta es un error
                createErrorModal('Error al enviar el mensaje', 'Hubo un problema al enviar tu mensaje. Por favor, intenta nuevamente.');
            }
        } catch (error) {
            // En caso de error en la solicitud (ej. problemas de red)
            createErrorModal('Error al enviar el mensaje', 'Hubo un problema técnico. Por favor, intenta nuevamente más tarde.');
        }
    });
});

// Mostrar modal de éxito
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

    // Mostrar el modal con Bootstrap
    $('#successModal').modal('show');

    // Remover el modal después de que se cierre
    $('#successModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

// Mostrar modal de error
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

    // Mostrar el modal con Bootstrap
    $('#errorModal').modal('show');

    // Remover el modal después de que se cierre
    $('#errorModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

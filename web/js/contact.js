import { NO_SQL_API_BASE_URL } from './config.js';
import { createSuccessModal, createErrorModal } from './modals.js';

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

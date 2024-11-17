import { NO_SQL_API_BASE_URL } from './config.js';
import { createSuccessModal, createErrorModal } from './modals.js';

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
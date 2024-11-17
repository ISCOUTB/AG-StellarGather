import { API_BASE_URL } from './config.js';
import { createSuccessModal, createErrorModal } from './modals.js';

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

            // Redirige después de 2 segundos
            setTimeout(() => {
                // Redirige a la página original
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect') || '/';
                window.location.href = redirectUrl;
            }, 2000);

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
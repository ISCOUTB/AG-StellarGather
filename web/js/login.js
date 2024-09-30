import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Función para manejar el login
    document.getElementById('login-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) throw new Error('Error en el inicio de sesión. Verifica tus credenciales.');

            const data = await response.json();
            // Guarda el token de autenticación si se provee
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('full_name', data.full_name);
            alert('¡Inicio de sesión exitoso!');
            window.location.href = '/';
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            alert('Credenciales incorrectas. Por favor, verifica y vuelve a intentar.');
        }
    });
});

function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

document.addEventListener('DOMContentLoaded', () => {
    // Validación para el login
    document.getElementById('login-form')?.addEventListener('input', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitButton = document.querySelector('.btn');

        // Validar correo y contraseña
        if (validateEmail(email) && validatePassword(password)) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    });
});


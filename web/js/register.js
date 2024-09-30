import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Función para manejar el registro
    document.getElementById('register-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const termsCheckbox = document.querySelector('input[type="checkbox"]');
        if (!termsCheckbox.checked) {
            alert('Debes aceptar los términos y condiciones.');
            return;
        }

        const username = document.getElementById('username').value;
        const full_name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, full_name}),
            });

            if (!response.ok) throw new Error('Error en el registro. Intenta nuevamente.');

            alert('¡Registro completado con éxito! Inice sesión para confirmar.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error en el registro:', error);
            alert('Hubo un problema al registrar. Por favor, verifica tus datos.');
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


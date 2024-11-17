import { API_BASE_URL } from './config.js';
import { createSuccessModal, createErrorModal } from './modals.js';

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

            // Redirigir después de 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html'; 
            }, 2000);
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

import { API_BASE_URL } from './config.js';

document.addEventListener("DOMContentLoaded", function () {
    const userId = localStorage.getItem('user_id');

    // Función para obtener la lista de países
    async function getCountries() {
        try {
            const response = await fetch("https://restcountries.com/v3.1/all");
            if (response.ok) {
                const countries = await response.json();

                // Ordenar los países alfabéticamente por su nombre
                countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

                // Poblar el select de países
                const countrySelect = document.getElementById("edit-country");
                countries.forEach(country => {
                    const option = document.createElement("option");
                    option.value = country.name.common;  // Usamos el nombre común del país como valor
                    option.innerText = country.name.common;  // El texto visible es el nombre común
                    countrySelect.appendChild(option);
                });
            } else {
                createErrorModal("Error al cargar países", "No se pudo cargar la lista de países.");
            }
        } catch (error) {
            createErrorModal("Error al cargar países", "Hubo un error al cargar la lista de países.");
        }
    }

    // Función para obtener los datos del usuario desde la API
    async function getUserData() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`);
            
            if (response.ok) {
                const user = await response.json();

                // Mostrar la foto de perfil
                const profilePhoto = `img/user/${user.id}.webp`;
                const imgElement = document.getElementById("profile-photo");
                imgElement.onerror = function() {
                    if (user.gender === 'male') {
                        imgElement.src = `img/user/male-user.webp`;
                    } else if (user.gender === 'female') {
                        imgElement.src = `img/user/female-user.webp`;
                    } else {
                        imgElement.src = `img/user/male-user.webp`;
                    }
                };
                imgElement.src = profilePhoto;
                document.getElementById("profile-name").innerText = user.full_name;

                // Mostrar los datos del usuario en la página
                document.getElementById("username").innerText = user.username;
                document.getElementById("full-name").innerText = user.full_name;
                document.getElementById("email").innerText = user.email;
                let genderText;
                if (user.gender === 'male') {
                    genderText = 'Masculino';
                } else if (user.gender === 'female') {
                    genderText = 'Femenino';
                } else {
                    genderText = 'No especificado';
                }
                document.getElementById("gender").innerText = genderText;
                document.getElementById("country").innerText = user.country || 'No especificado';
                document.getElementById("phone-number").innerText = user.phone_number || 'No disponible';
                document.getElementById("birth-date").innerText = user.birth_date || 'No especificado';
                document.getElementById("created-at").innerText = formatDateToLocal(user.created_at); 
                document.getElementById("updated-at").innerText = formatDateToLocal(user.updated_at); 

                // Rellenar el formulario de edición con los datos actuales
                document.getElementById("edit-username").value = user.username;
                document.getElementById("edit-full-name").value = user.full_name;
                document.getElementById("edit-email").value = user.email;
                document.getElementById("edit-gender").value = user.gender || '';
                await getCountries(); // Llamada para obtener la lista de países
                document.getElementById("edit-country").value = user.country || '';
                document.getElementById("edit-phone-number").value = user.phone_number || '';
                document.getElementById("edit-birth-date").value = user.birth_date ? new Date(user.birth_date).toISOString().split('T')[0] : ''; // Asegura el formato correcto para la fecha
            } else {
                createErrorModal("Error al obtener datos del usuario", "No se pudo cargar la información del usuario.");
            }
        } catch (error) {
            createErrorModal("Error al obtener datos del usuario", "Hubo un error al obtener los datos del usuario.");
        }
    }

    // Función para convertir la fecha UTC a hora local
    function formatDateToLocal(utcDate) {
        const date = new Date(utcDate);
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        
        const options = {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        const formattedDate = localDate.toLocaleString('es-ES', options);
        
        const timezoneOffset = localDate.getTimezoneOffset();
        const sign = timezoneOffset > 0 ? '-' : '+';
        const offset = Math.abs(timezoneOffset / 60);  
        const gmt = ` GMT${sign}${String(offset).padStart(2, '0')}`;
        
        return `${formattedDate} ${gmt}`;
    }

    // Función para actualizar los datos del usuario
    async function updateUserData(event) {
        event.preventDefault(); // Evitar el envío por defecto del formulario

        // Obtener los datos actuales del usuario
        const genderText = document.getElementById("gender").innerText;
        const genderFinal = genderText === 'Masculino' ? 'male' : genderText === 'Femenino' ? 'female' : '';

        const currentUserData = {
            username: document.getElementById("username").innerText,
            email: document.getElementById("email").innerText,
            full_name: document.getElementById("full-name").innerText,
            gender: genderFinal,
            country: document.getElementById("country").innerText,
            phone_number: document.getElementById("phone-number").innerText,
            birth_date: document.getElementById("birth-date").innerText,
        };

        // Construir el objeto con los campos modificados
        const updatedUser = {};
        const modifiedFields = [];  // Lista para almacenar los campos modificados

        // Compara cada campo y solo incluye aquellos que fueron modificados
        const username = document.getElementById("edit-username").value;
        if (username && username !== currentUserData.username) {
            updatedUser.username = username;
            modifiedFields.push('Nombre de usuario');
        }

        const email = document.getElementById("edit-email").value;
        if (email && email !== currentUserData.email) {
            updatedUser.email = email;
            modifiedFields.push('Correo electrónico');
        }

        const fullName = document.getElementById("edit-full-name").value;
        if (fullName && fullName !== currentUserData.full_name) {
            updatedUser.full_name = fullName;
            modifiedFields.push('Nombre completo');
        }

        const gender = document.getElementById("edit-gender").value;
        if (gender && gender !== currentUserData.gender) {
            updatedUser.gender = gender;
            modifiedFields.push('Género');
        }

        const country = document.getElementById("edit-country").value;
        if (country && country !== currentUserData.country) {
            updatedUser.country = country;
            modifiedFields.push('País');
        }

        const phoneNumber = document.getElementById("edit-phone-number").value;
        if (phoneNumber && phoneNumber !== currentUserData.phone_number) {
            updatedUser.phone_number = phoneNumber;
            modifiedFields.push('Número de teléfono');
        }

        const birthDate = document.getElementById("edit-birth-date").value;
        if (birthDate && birthDate !== currentUserData.birth_date) {
            updatedUser.birth_date = birthDate;
            modifiedFields.push('Fecha de nacimiento');
        }

        // Si no se ha modificado ningún campo, mostrar un mensaje y no hacer la solicitud
        if (modifiedFields.length === 0) {
            createErrorModal("No se han realizado cambios", "No se ha modificado ningún campo. Por favor, realiza algún cambio antes de intentar guardar.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedUser), // Enviar solo los campos modificados
            });

            if (response.ok) {
                const updatedData = await response.json();

                // Crear el mensaje de éxito que indica los campos modificados
                const fieldsMessage = modifiedFields.length > 0 
                    ? `Se han modificado los siguientes campos de manera exitosa: ${modifiedFields.join(', ')}.` 
                    : 'No se realizaron modificaciones en los datos.';

                createSuccessModal(fieldsMessage);

                // Actualizar la UI con los nuevos datos
                document.getElementById("username").innerText = updatedData.username;
                document.getElementById("full-name").innerText = updatedData.full_name;
                document.getElementById("email").innerText = updatedData.email;
                let updatedGenderText;
                if (updatedData.gender === 'male') {
                    updatedGenderText = 'Masculino';
                } else if (updatedData.gender === 'female') {
                    updatedGenderText = 'Femenino';
                } else {
                    updatedGenderText = 'No especificado';
                }
                document.getElementById("gender").innerText = updatedGenderText;
                document.getElementById("country").innerText = updatedData.country || 'No especificado';
                document.getElementById("phone-number").innerText = updatedData.phone_number || 'No disponible';
                document.getElementById("birth-date").innerText = updatedData.birth_date || 'No especificado';
                document.getElementById("created-at").innerText = formatDateToLocal(updatedData.created_at); 
                document.getElementById("updated-at").innerText = formatDateToLocal(updatedData.updated_at);
                document.getElementById("profile-name").innerText = updatedData.full_name;
            } else {
                createErrorModal("Error al actualizar los datos", "Hubo un problema al actualizar la información.");
            }
        } catch (error) {
            console.error("Error updating user data:", error);
            createErrorModal("Error al actualizar los datos", "Hubo un error al actualizar los datos.");
        }
    }
        

    // Asociar el evento de enviar formulario para actualizar los datos
    const form = document.getElementById("edit-user-form"); // Asegúrate de tener un formulario con este ID
    if (form) {
        form.addEventListener("submit", updateUserData);
    }

    // Función para alternar la visibilidad de las contraseñas
    function togglePasswordVisibility(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);
        
        toggleIcon.addEventListener("click", function() {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                toggleIcon.innerHTML = '<i class="fas fa-eye-slash"></i>'; // Cambiar icono a "ojo cerrado"
            } else {
                passwordInput.type = "password";
                toggleIcon.innerHTML = '<i class="fas fa-eye"></i>'; // Cambiar icono a "ojo abierto"
            }
        });
    }

    // Llamar a la función para alternar visibilidad de las contraseñas
    togglePasswordVisibility("current-password", "toggle-current-password");
    togglePasswordVisibility("new-password", "toggle-new-password");
    togglePasswordVisibility("confirm-password", "toggle-confirm-password");

    // Función para cambiar la contraseña
    async function changePassword(event) {
        event.preventDefault(); // Evitar el envío por defecto del formulario

        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            createErrorModal("Error en las contraseñas", "Las contraseñas nuevas no coinciden.");
            return;
        }

        // Validar que la contraseña actual no esté vacía
        if (!currentPassword) {
            createErrorModal("Error en la contraseña actual", "La contraseña actual no puede estar vacía.");
            return;
        }

        // Validar que la nueva contraseña no esté vacía
        if (!newPassword) {
            createErrorModal("Error en la nueva contraseña", "La nueva contraseña no puede estar vacía.");
            return;
        }

        try {
            // Paso 1: Validar la contraseña actual
            const passwordValidationResponse = await fetch(`${API_BASE_URL}/users/validate-password/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: currentPassword,
                }),
            });

            if (!passwordValidationResponse.ok) {
                const error = await passwordValidationResponse.json();
                createErrorModal("Contraseña actual incorrecta", error.detail);
                return;
            }

            // Paso 2: Si la contraseña actual es válida, proceder a actualizar la contraseña
            const updateResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: newPassword,
                }),
            });

            if (updateResponse.ok) {
                createSuccessModal("Contraseña actualizada correctamente");
                document.getElementById("current-password").value = '';
                document.getElementById("new-password").value = '';
                document.getElementById("confirm-password").value = '';
            } else {
                const error = await updateResponse.json();
                createErrorModal("Error al cambiar la contraseña", error.detail);
            }
        } catch (error) {
            console.error("Error cambiando la contraseña:", error);
            createErrorModal("Error al cambiar la contraseña", "Hubo un error al cambiar la contraseña.");
        }
    }


    // Asociar el evento de enviar formulario para cambiar la contraseña
    const passwordForm = document.getElementById("change-password-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", changePassword);
    }

    // Llamar a la función para obtener los datos del usuario y la lista de países al cargar la página
    getUserData(); // Llamada para obtener los datos del usuario
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
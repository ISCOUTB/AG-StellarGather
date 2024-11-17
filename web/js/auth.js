const API_SQL_BASE_URL = 'http://localhost:8010';

function updateAuthLinks() {
    const authLinks = document.getElementById('authLinks');
    const currentPath = window.location.pathname;
    if (authLinks) {
        authLinks.innerHTML = `
        <a href="/" class="nav-item nav-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}">Home</a>
        <a href="../about.html" class="nav-item nav-link ${currentPath === '/about.html' ? 'active' : ''}">¿Quiénes somos?</a>
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle ${currentPath === '/events.html' ? 'active' : ''}" id="profileDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Eventos</a>
            <div class="dropdown-menu" aria-labelledby="eventsDropdown">
                <a href="../events.html" class="dropdown-item">Todos los Eventos</a>
                <a href="../events/category.html" class="dropdown-item">Por Categoría</a>
                <a href="../events/date.html" class="dropdown-item">Por Fecha</a>
                <a href="../events/organizer.html" class="dropdown-item">Por Organizador</a>
                <a href="../events/country.html" class="dropdown-item">Por País</a>
            </div>
        </div>
        `;
    }

    const isLoggedIn = localStorage.getItem('authToken');

    if (isLoggedIn && authLinks) {
        authLinks.innerHTML += `
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle" id="profileDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Mi Perfil</a>
            <div class="dropdown-menu" aria-labelledby="profileDropdown">
                <a href="../my-registers.html" class="dropdown-item">Mis Registros</a>
                <a href="../my-profile.html" class="dropdown-item">Mi Información</a>
                <a href="#" onclick="logout()" class="dropdown-item">Cerrar Sesión</a>
            </div>
        </div>
        <a href="../contact.html" class="nav-item nav-link">Contacto</a>`;

        // Verificar el rol del usuario
        checkUserRole();

        // Si el usuario está en login.html o register.html, redirigirlo
        if (window.location.pathname === '/login.html' || window.location.pathname === '/register.html') {
            window.location.href = '/';
        }
    }

    if (!isLoggedIn && authLinks) {
        authLinks.innerHTML += `
        <a href="../login.html" class="nav-item nav-link">Iniciar Sesión</a>
        <a href="../contact.html" class="nav-item nav-link">Contacto</a>`;
    }
}

// Función para manejar el logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('full_name');
    localStorage.removeItem('user_id');
    window.location.href = "/";
}

function checkUserRole() {
    const userId = localStorage.getItem('user_id');
    fetch(`${API_SQL_BASE_URL}/users/${userId}/is-admin`)
        .then(response => response.json())
        .then(data => {
            if (data.is_admin && !document.querySelector('.nav-item.nav-link[href="../admin-dashboard.html"]')) {
                const authLinks = document.getElementById('authLinks');
                if (authLinks) {
                    authLinks.innerHTML += `
                    <a href="../admin-dashboard.html" class="nav-item nav-link">Admin Dashboard</a>`;
                }
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

document.addEventListener('DOMContentLoaded', updateAuthLinks);
const API_SQL_BASE_URL = 'http://localhost:8010';

function updateAuthLinks() {
    const authLinks = document.getElementById('authLinks');
    const currentPath = window.location.pathname;
    if (authLinks) {
        authLinks.innerHTML = `
        <a href="/" class="nav-item nav-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}">Home</a>
        <a href="../about.html" class="nav-item nav-link ${currentPath === '/about.html' ? 'active' : ''}">¿Quiénes somos?</a>
        <a href="../events.html" class="nav-item nav-link ${currentPath === '/events.html' ? 'active' : ''}">Eventos</a>`;
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
        const userId = localStorage.getItem('user_id');
        fetch(`${API_SQL_BASE_URL}/users/${userId}/is-admin`)
            .then(response => response.json())
            .then(data => {
                if (data.is_admin && !document.querySelector('.nav-item.nav-link[href="../admin-dashboard.html"]')) {
                    authLinks.innerHTML += `
                    <a href="../admin-dashboard.html" class="nav-item nav-link">Admin Dashboard</a>`;
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
        // Si el usuario está en login.html o register.html, redirigirlo
        if (window.location.pathname === '/login.html' || window.location.pathname === '/register.html') {
            window.location.href = '/';
        }
    } else {
        if (authLinks) {
            authLinks.innerHTML += `
            <a href="../login.html" class="nav-item nav-link">Iniciar Sesión</a>
            <a href="../contact.html" class="nav-item nav-link">Contacto</a> 
            `;
        }
    }
}

// Función para manejar el logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('full_name');
    localStorage.removeItem('user_id');
    window.location.href = "/";
}
document.addEventListener('DOMContentLoaded', updateAuthLinks);
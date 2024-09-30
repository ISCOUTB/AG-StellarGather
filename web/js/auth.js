function updateAuthLinks() {
    const authLinks = document.getElementById('authLinks');
    authLinks.innerHTML = '<li><a href="/">Inicio</a></li><li><a href="#">Explorar Eventos</a></li>';

    const isLoggedIn = localStorage.getItem('authToken');

    if (isLoggedIn) {
        const username = localStorage.getItem('full_name');
        authLinks.innerHTML += `
            <li><p>Hola, ${username}</p></li>
            <li><a href="#" onclick="logout()" class="register-btn">Logout</a></li>
        `;
        // Si el usuario está en login.html o register.html, redirigirlo
        if (window.location.pathname === '/login.html' || window.location.pathname === '/register.html') {
            window.location.href = '/';
        }
    } else {
        authLinks.innerHTML += `
            <li><a href="login.html">Iniciar Sesión</a></li>
            <li><a href="register.html" class="register-btn">Regístrate</a></li>
        `;
    }
}

// Función para manejar el logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('full_name');
    window.location.href = "/";
}
document.addEventListener('DOMContentLoaded', updateAuthLinks);
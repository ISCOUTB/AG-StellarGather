// Función para incluir archivos HTML
function includeHTML() {
    const includes = document.querySelectorAll('[data-include]');
    includes.forEach(el => {
        const file = el.getAttribute('data-include');
        fetch(file)
            .then(response => response.text())
            .then(data => {
                el.innerHTML = data;
                updateAuthLinks();
            });
    });
}

document.addEventListener('DOMContentLoaded', includeHTML);

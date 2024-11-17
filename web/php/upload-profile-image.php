<?php
// Verificar que la petición es válida
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['image']) && isset($_POST['user_id'])) {
        $image = $_FILES['image'];
        $userId = (int) $_POST['user_id'];
        
        // Validar tipo de archivo
        $allowedMimeTypes = ['image/webp'];
        if (!in_array($image['type'], $allowedMimeTypes)) {
            echo json_encode(['success' => false, 'message' => 'La imagen debe ser un archivo .webp']);
            exit;
        }

        // Subir la imagen al servidor
        $uploadDir = '../img/user/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true); // Crear directorio si no existe
        }

        $imagePath = $uploadDir . $userId . '.webp';

        // Mover el archivo a la carpeta (sobrescribirá si ya existe)
        if (move_uploaded_file($image['tmp_name'], $imagePath)) {
            // Si la subida es exitosa
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al subir la imagen']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No se proporcionaron los datos necesarios']);
    }
}

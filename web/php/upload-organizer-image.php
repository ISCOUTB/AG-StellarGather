<?php
// Verificar que la petición es válida
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['image']) && isset($_POST['organizer_id'])) {
        $image = $_FILES['image'];
        $organizerId = (int) $_POST['organizer_id'];
        
        // Validar tipo de archivo
        $allowedMimeTypes = ['image/webp'];
        if (!in_array($image['type'], $allowedMimeTypes)) {
            echo json_encode(['success' => false, 'message' => 'La imagen debe ser un archivo .webp']);
            exit;
        }

        // Validar tamaño de la imagen
        list($width, $height) = getimagesize($image['tmp_name']);
        if ($width !== 200 || $height !== 200) {
            echo json_encode(['success' => false, 'message' => 'La imagen debe tener un tamaño de 100x100 píxeles']);
            exit;
        }

        // Subir la imagen al servidor
        $uploadDir = '../img/organizer/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $imagePath = $uploadDir . $organizerId . '.webp';

        // Mover el archivo a la carpeta
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

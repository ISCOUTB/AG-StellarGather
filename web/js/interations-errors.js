import { NO_SQL_API_BASE_URL } from './config.js';

export function logInteraction(userId, interactionType, metadata, duration) {
    const interaction = {
      userId: userId,
      interactionType: interactionType,
      metadata: {
        ...metadata,
        pageUrl: window.location.href,
      },
      duration: duration,
      timestamp: new Date().toISOString(),
    };
  
    fetch(`${NO_SQL_API_BASE_URL}/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interaction),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo registrar la interacción');
      }
      return response.json();
    })
    .then(data => {
      console.log('Interacción registrada exitosamente:', data);
    })
    .catch(error => {
      console.error('Error al registrar la interacción:', error);
    });
  }

export function logError(errorMessage, errorCode, service, information) {
    const error = {
      errorMessage: errorMessage,
      errorCode: errorCode,
      service: service,
      information: information,
      timestamp: new Date().toISOString(), // Tiempos en formato ISO 8601
    };
  
    fetch(`${NO_SQL_API_BASE_URL}/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo registrar el error');
      }
      return response.json();
    })
    .then(data => {
      console.log('Error registrado exitosamente:', data);
    })
    .catch(error => {
      console.error('Error al registrar el error:', error);
    });
  }
  
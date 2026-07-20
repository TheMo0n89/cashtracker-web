export function getApiErrorMessage(error: unknown) {
  const fallback = 'La acción no pudo completarse. Intenta nuevamente.';

  if (!error || typeof error !== 'object') return fallback;

  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: unknown;
        code?: unknown;
      };
    };
    message?: string;
  };

  const message = maybeAxiosError.response?.data?.message;
  const code = maybeAxiosError.response?.data?.code;

  if (code === 'CATEGORY_HAS_TRANSACTIONS') {
    return 'No se puede eliminar esta categoría porque tiene transacciones registradas.';
  }

  if (Array.isArray(message)) {
    return message.join('. ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (maybeAxiosError.message) {
    return maybeAxiosError.message;
  }

  return fallback;
}

// Maps Supabase/Postgres error codes to user-facing Spanish messages.
// Keep it tiny — only translate codes we explicitly hit.

interface SupabaseLikeError {
  code?: string;
  message?: string;
}

const UNIQUE_VIOLATION_MESSAGES: Record<string, string> = {
  lideres_nombre_apellido_key:
    'Ya existe un patrocinador con ese nombre y apellido.',
  clientes_unique_business_key:
    'Ya existe un cliente con el mismo nombre, teléfono, patrocinador y fecha de pago.',
  paquetes_nombre_key:
    'Ya existe un paquete con ese nombre.',
};

export function describeSupabaseError(err: unknown): string {
  const e = err as SupabaseLikeError | null;
  if (!e) return 'Error desconocido';

  if (e.code === '23505' && e.message) {
    for (const key of Object.keys(UNIQUE_VIOLATION_MESSAGES)) {
      if (e.message.includes(key)) return UNIQUE_VIOLATION_MESSAGES[key];
    }
    return 'Ya existe un registro con esos datos.';
  }

  return e.message ?? 'Error desconocido';
}

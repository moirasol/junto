// Forma de resultado usada por los servicios, consistente con los ejemplos
// de "resultado esperado para input inválido" del spec (sección 2).
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; errorCode: string; message: string };

export function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function fail<T>(errorCode: string, message: string): ServiceResult<T> {
  return { success: false, errorCode, message };
}

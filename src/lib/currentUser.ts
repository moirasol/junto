import { generateId } from "./ids";

// TODO (spec §8): autenticación sin definir (login real vs. usuarios
// simulados). Se usa un usuario de navegador persistido en localStorage y un
// selector manual de "quién sos en este viaje" para poder probar acciones
// que dependen de la identidad (votar, confirmar, cargar y editar gastos).

const USER_KEY = "junto:currentUserId";

export function getCurrentUserId(): string {
  if (typeof window === "undefined") return "user_ssr";
  let userId = window.localStorage.getItem(USER_KEY);
  if (!userId) {
    userId = generateId("user");
    window.localStorage.setItem(USER_KEY, userId);
  }
  return userId;
}

function actingKey(tripId: string): string {
  return `junto:actingParticipant:${tripId}`;
}

export function getActingParticipantId(tripId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(actingKey(tripId));
}

export function setActingParticipantId(tripId: string, participantId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(actingKey(tripId), participantId);
}

// userId "efectivo" para acciones que requieren *ByUserId: se usa el
// participante activo como identidad (mock), o el usuario del navegador si
// todavía no se eligió ninguno.
export function getActingUserId(tripId: string): string {
  return getActingParticipantId(tripId) ?? getCurrentUserId();
}

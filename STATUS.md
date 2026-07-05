# Estado del prototipo — Junto

_Última actualización: 2026-07-05_

## ¿Ya terminó el proto?

**Sí, para el alcance que definimos.** Cubre:

- Camino feliz completo (crear → invitar → votar → confirmar → gastos → liquidación → cerrar → exportar)
- Los 10 casos borde de la sección 5, probados en vivo uno por uno
- Todos los tipos, validaciones, reglas de negocio y el algoritmo de liquidación tal cual el spec
- IA mockeada (comandos en lenguaje natural + resúmenes), siempre con confirmación humana
- Copy obligatorio de la 7.11 verbatim
- Build de producción y type-check sin errores

## Lo que queda abierto a propósito

(Son los TODOs del spec §8, no bugs)

- Persistencia en localStorage, auth simulada, vínculo organizador↔participante — todo mockeado y comentado como TODO, no como decisión final
- No hay tests automatizados (el spec de Junto no pide un framework de testing, a diferencia del otro proyecto del curso)
- No hay integración real con `claude-sonnet-4` (mock determinístico, como pediste)

Condición: **prototipo terminado y demostrable**.

## Próximos pasos hechos después de este punto

1. Git inicializado y primer commit hecho.
2. Pasada de code review (high effort, 8 ángulos) → 9 hallazgos verificados y reportados.
3. Corregidos los 5 hallazgos de correctness de la review:
   - `editConfirmedExpense` ahora valida contra el `createdByUserId` real del gasto guardado, no contra un campo que manda el mismo llamador.
   - Parser de IA (`aiCommandService.ts`): reconoce nombres con tildes/ñ (`\p{L}` en vez de `\w`), interpreta bien el separador de miles argentino ("45.000"), y ya no falla si la descripción tiene una coma.
   - `voteDecision` bloquea votos en decisiones `needs_review` (antes solo bloqueaba `confirmed`), tanto en el validador como deshabilitando el botón en la UI.
4. **Pendiente, a propósito, sin resolver todavía** (hallazgos de menor severidad de la misma review):
   - Dos definiciones distintas de "quién es el organizador" (`trip.participants[0]` vs. `trip.createdByUserId`) — hoy no rompe nada, pero podría desalinearse si el orden de participantes cambia alguna vez.
   - `calculateBalances` y el `notify()` de `storage.ts` re-leen/re-parsean todo el localStorage más de lo necesario — no es un bug, es una optimización pendiente.
5. Iteración de UX/UI: se llevaron elementos de look & feel del otro proyecto del curso (Tripulante) sin salirse del PRD/spec de Junto (que pide "web app", no "mobile app"):
   - Avatares con iniciales para integrantes (`Avatar`/`AvatarStack` en `Primitives.tsx`).
   - Card "hero" con gradiente para el resumen del viaje (destino, nombre, estado, avatares) en `src/app/trips/[tripId]/layout.tsx`, compartida por todas las subpáginas del viaje.
   - Navegación por tabs con íconos (Resumen/Decisiones/Gastos/Liquidación) con estado activo, en vez de links de texto sueltos.
   - Íconos (`lucide-react`) en botones, headers de sección y badges de estado de decisión.
   - Revisado en viewport mobile (375px): sin overflow ni cortes.

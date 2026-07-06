# Guión de demo — cosas para contar, no mostrar

Partes del flujo que existen y funcionan, pero que en la demo de 10 min
conviene **explicar en voz alta** en vez de mostrar en vivo (por tiempo,
o porque requerirían un segundo dispositivo/navegador).

## 1. El lado de la persona invitada por link

**Cuándo mencionarlo:** justo después de mostrar el botón "Copiar link" en
Integrantes.

**Qué decir (más o menos):**

> "Este link se lo mandaría por WhatsApp a cada persona del viaje. Cuando
> lo abre en su celular, le aparece una pantalla simple con el nombre del
> viaje y le pide que ponga su nombre. En una versión real ahí tendría que
> loguearse — hoy no lo estamos mostrando porque el prototipo no tiene
> autenticación real, es un mock. Lo importante es que usar el link no
> confirma automáticamente que esa persona va: la deja como 'invitada',
> pendiente, y recién cuando ella misma toca 'Aceptar' pasa a confirmada
> — el mismo criterio que usamos para las invitaciones manuales."

**Por qué se decidió así:** el prototipo no tiene backend (todo vive en
localStorage por navegador), así que el link sólo funciona de verdad si
se abre en el mismo navegador que ya tiene el viaje cargado — no sirve
para cruzar dispositivos. Por eso esta parte se cuenta y no se demuestra
en vivo con un segundo dispositivo real.

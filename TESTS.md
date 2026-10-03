# Smoke test v12
1. Abrir app y comprobar datos previos.
2. Añadir flexiones y verificar mensaje/media.
3. Progreso: calendario, tocar ayer, añadir flexiones/comida a ayer.
4. Ver racha semanal y mejor semana.
5. Comida: buscar coco, favorito, reciente, describir y botón Dictar.
6. Foto de comida + contexto -> revisar -> guardar.
7. Check-in con foto -> historial -> Antes/Ahora.
8. Exportar backup y confirmar que descarga JSON.
9. Actividad manual -> comprobar ajuste de objetivo kcal.

## v13 · preparación GTR 4
- Mantiene la clave localStorage `susu` y migra schema a 13.
- Estructura diaria preparada para pasos, kcal activas, distancia, minutos de ejercicio, sueño, FC reposo, workouts, fuente y hora de actualización.
- Prioridad kcal: si existen kcal importadas de Salud se usan esas; si no, se usa actividad manual. No se suman ambas.
- Tarjeta GTR 4/Salud preparada en HOY y pantalla de estado.
- Sin puente HealthKit todavía: no se afirma sincronización automática hasta instalar el componente iOS.

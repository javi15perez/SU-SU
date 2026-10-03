# SU SU v13

Versión consolidada de SU SU.

Incluye: mensajes motivacionales por progreso, macros visuales, media de flexiones de 7 días, calendario mensual, edición de días anteriores, racha de semanas naturales (5/7), mejor semana y récords, resumen semanal, tendencia de peso, comparador de fotos, botón + global, búsqueda/recientes/favoritos, texto o dictado de comida, foto + contexto, aprendizaje local de comidas, actividad manual con ajuste de kcal y almacenamiento de fotos en IndexedDB.

## Actualización
Mantiene la clave `susu`; los datos existentes se migran. Las fotos antiguas en localStorage se migran a IndexedDB cuando sea posible.

## Gemini
Para texto/dictado y foto + contexto, sustituye el código del Worker actual por `cloudflare-worker-v13.js` y despliega. La API key sigue guardada como secret del Worker.

## Backup
El backup JSON incluye también las fotos, aunque internamente se guarden en IndexedDB.

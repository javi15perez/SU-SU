# SU SU — Minimal PWA

PWA mobile-first para iPhone. Sin framework ni backend obligatorio: GitHub Pages + almacenamiento local.

## UX
- Home: media diaria de flexiones del mes, objetivo, kcal, macros y resumen de flexiones/dominadas.
- Comida: búsqueda rápida + captura de foto.
- Progreso: gráfica 7D/30D/3M/1A, récords, check-in semanal, fotos y comparación.
- Backup JSON export/import.
- Offline mediante service worker.

## Gemini (foto de comida)
Nunca pongas una Gemini API key en `app.js`: el repositorio y GitHub Pages son públicos.

En Ajustes existe `Endpoint privado para Gemini`. Debe aceptar POST JSON:
`{ image: "data:image/jpeg;base64,...", prompt: "..." }`
y devolver:
`{ "name":"...", "kcal":650, "protein_g":40, "carbs_g":70, "fat_g":20 }`

La opción recomendada es un Cloudflare Worker con la API key guardada como Secret. Sin endpoint, la cámara sigue funcionando y abre el registro manual con la foto como referencia.

## Publicación
Sube el contenido de esta carpeta a la raíz de `javi15perez/SU-SU` y GitHub Pages servirá la app estática.

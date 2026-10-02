# SU SU v5
PWA personal mobile-first, sin backend obligatorio y preparada para GitHub Pages.

## v5
- Home minimalista: media diaria de flexiones + kcal.
- Flexiones/dominadas guardadas como eventos; +10 siempre registra exactamente +10.
- Deshacer última entrada de flexiones.
- Comida por búsqueda, manual o cámara.
- Flujo Gemini preparado mediante endpoint privado; nunca expone una API key en GitHub Pages.
- Progreso con gráficas 7D/30D/3M/1A.
- Check-in semanal único: peso, cintura, medidas opcionales y hasta 3 fotos.
- Fotos ocultas de la pantalla principal; solo en Historial corporal / comparación.
- Backup JSON, persistencia local y offline.

## Gemini
En Ajustes existe `Endpoint Gemini`. Debe apuntar a un endpoint privado que acepte POST JSON `{ image: "data:image/jpeg;base64,..." }` y devuelva:
`{ "name":"...", "kcal":650, "protein_g":40, "carbs_g":70, "fat_g":20 }`.
La API key debe guardarse como secreto en el servidor/Worker, nunca en `app.js`.

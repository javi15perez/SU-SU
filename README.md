# SU SU v17 — audited candidate

Base: v16 development branch, corrected and audited before release.

Includes: smart food search + Gemini interpretation, photo/context, favorites/recent habits, barcode lookup via Open Food Facts, nutrition-label scan via Gemini, calendar with 02:00 SU SU day cutoff, weekly/monthly progress, daily summary, deletable meals/exercise with confirmation, body/meal photos in IndexedDB, backups, maintenance estimate, and data model prepared for GTR 4 / Apple Health.

Important: GTR 4 / HealthKit automatic sync and native Siri are NOT implemented yet. URL actions are only groundwork for future iPhone Shortcuts.

Before using barcode AI fallback / nutrition-label scan, deploy `cloudflare-worker-v17.js` per `UPDATE-WORKER.txt`.

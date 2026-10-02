# SU SU v7 smoke tests

- Persistencia: clave estable `susu`, `schemaVersion: 7`, migración desde `susu-v6`, `susu-v5` y `susu-min-v1`.
- Flexiones: ledger append-only; total HOY derivado exclusivamente de eventos; toast muestra incremento y total resultante.
- Undo: elimina exactamente el último evento y persiste antes de confirmar UI.
- Service worker: actualización network-first con `cache: no-cache/reload`, fallback HTML solo para navegación.
- Cámara/Galería: inputs separados; cámara solicita `capture=environment`.
- IA: timeout 15 s, validación básica del payload y fallback manual.
- Import: validación mínima + copia `susu-prev` antes de reemplazar estado.

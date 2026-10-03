# Pruebas realizadas / smoke test v17

Automáticas ejecutadas:
- Sintaxis app.js, sw.js y Worker.
- Migración simulada v15 -> v17 preservando comida/flexiones y creando backup previo.
- Corte 02:00: 01:59 -> día anterior; 02:00 -> día actual.
- Cambio de mes y semana lunes-domingo.
- Fórmula de mantenimiento: ganar peso => mantenimiento < ingesta; perder => mantenimiento > ingesta.
- Contrato Worker simulado: texto, etiqueta nutricional y lectura de barcode.
- Invariantes: schema/backup/cache v17, sin función antigua streak(), confirmación de borrado.

Pruebas que requieren dispositivo/servicio real antes de considerarla estable:
1. Actualización real desde la versión instalada conservando datos/fotos.
2. Interpretar texto contra Worker desplegado.
3. Foto + contexto contra Worker desplegado.
4. Código de barras con cámara de iPhone y Open Food Facts.
5. Etiqueta nutricional con cámara y Worker v17.
6. Exportar -> importar backup real con fotos.
7. Cambio real de 01:59 a 02:00 si se quiere validar en vivo.

No se considera implementado: HealthKit/GTR 4 automático ni Siri nativo.

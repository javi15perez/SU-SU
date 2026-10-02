# SU SU v7

PWA minimalista para nutrición, flexiones/dominadas y progreso corporal.

## v7
- Ledger estricto de flexiones: cada pulsación guarda un evento y el total de HOY es la suma exacta de esos eventos.
- Últimos registros visibles para comprobar +10/+25 y Deshacer.
- Cámara trasera y Galería separadas.
- Flujo preparado para análisis nutricional por imagen mediante un Worker privado.
- Check-in corporal con medidas + fotos privadas.
- Offline y backup local.

## IA nutricional
La app nunca debe incluir claves en el frontend. `profile.geminiEndpoint` apunta a un Worker privado. El Worker previsto:
1. recibe una imagen JPEG comprimida;
2. Gemini identifica alimentos y estima porciones en JSON estructurado;
3. USDA FoodData Central aporta composición nutricional cuando existe correspondencia;
4. el Worker calcula kcal/proteína/carbohidratos/grasas;
5. la app obliga a revisar antes de guardar.

Las estimaciones fotográficas no sustituyen pesar ingredientes: aceite, salsas y componentes ocultos pueden alterar el resultado.

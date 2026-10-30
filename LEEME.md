# Sitio TapPayment

## Qué hay aquí
- `index.html` → página principal de TapPayment (lo que se ve en tudominio.com).
- `emilio/` → tu página de cobro (tudominio.com/emilio).
- `_plantilla/` → copia esta carpeta para cada cliente nuevo.
- `assets/` → diseño y funciones compartidas. No hace falta tocarlo.

## Agregar un cliente nuevo
1. Copia la carpeta `_plantilla` y ponle el nombre del negocio, en minúsculas y sin espacios ni acentos (ej. `tacos-el-guero`).
2. Abre su `index.html` con el Bloc de notas y cambia solo el bloque `window.CONFIG` (nombre, titular, CLABE, tarjeta, Dimo, WhatsApp, concepto).
3. Cambia también el texto de `<title>` por el nombre del negocio.
4. Sube los cambios. Su link queda en `tudominio.com/tacos-el-guero`.
5. Abre el link en tu celular, revisa que la CLABE salga "✓ válida" y con el banco correcto, y hasta entonces grábalo en la tarjeta NFC.

## Regla de oro
Un link grabado en una tarjeta NFC ya entregada no se cambia. Nunca renombres ni borres la carpeta de un cliente; si cambia de cuenta, solo edita su CONFIG.

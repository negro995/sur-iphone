# Sur IPhone — tienda online

Catálogo de iPhones de **Sur IPhone** ([@esquel_iphone](https://instagram.com/esquel_iphone)) con precios en USD, stock sincronizado desde Google Sheets y checkout por WhatsApp.

Stack: Next.js (App Router) · React · Tailwind CSS · Lucide.

## Cómo funciona

- **Catálogo en vivo**: `src/lib/catalog.ts` lee la hoja de Google (`GOOGLE_SHEET_ID`) y revalida cada 60 s (ISR).
  - Con `GOOGLE_SHEETS_API_KEY` usa la Google Sheets API v4; sin key usa el export CSV público de la hoja (la hoja tiene que estar compartida como "cualquiera con el enlace puede ver").
  - Las columnas se detectan por el encabezado, así que se pueden reordenar. Encabezados recomendados (minúsculas, sin acentos):
    `id`, `titulo`, `categoria` (`iPhones` / `Accesorios` / `Combos`), `almacenamiento`, `condicion`, `precio_usd`, `precio_oferta`, `bateria` (ej. `88%`), `estado` (ej. `Excelente`, `Reacondicionado A+`), `imagen_url`, `es_oferta` (`si` / `x`), `stock`.
  - También siguen funcionando los encabezados de la planilla original (`Modelo de iPhone`, `Almacenamiento (GB)`, `Condición`, `Batería (%)`, `Precio Contado ($)`, `Stock / Estado`).
  - Si `categoria` está vacía se infiere del título (iPhone, cargador/cable/funda/AirPods…, combo/promo).
  - Un producto es oferta si tiene `precio_oferta` o `es_oferta` marcado; aparece con badge y en "Ofertas Destacadas".
  - `imagen_url` acepta links directos o de Google Drive; si falta o no carga, se muestra una ilustración en su lugar.
  - Para varias pestañas usá `GOOGLE_SHEET_RANGE="iPhones!A1:Z200,Accesorios!A1:Z200"` o `CATALOG_CSV_URL` (CSV publicado, separados por coma).
  - Si `Stock / Estado` dice *Agotado*, *Sin stock*, *Vendido*, *Reservado* o *No disponible*, el equipo se muestra sin botón de compra.
- **Precios en USD**: si la hoja tiene una columna con "USD" en el encabezado, se usa tal cual. Si no, se convierte el `Precio Contado` (ARS) con `USD_ARS_RATE` o, si está vacío, con la cotización de [dolarapi.com](https://dolarapi.com) (`USD_RATE_SOURCE`, por defecto `blue`).
- **Transferencia / depósito**: el botón "Pagar por Transferencia" abre un resumen con N° de pedido, los datos bancarios (`BANK_CBU`, `BANK_ALIAS`, `BANK_HOLDER`, `BANK_NAME`, `BANK_CUIT` en Vercel → Settings → Environment Variables) y un botón para enviar el comprobante por WhatsApp. Sin datos cargados, ofrece pedirlos por WhatsApp.
- **WhatsApp**: "Comprar Contado (USD)" → +54 2945 54-6004 · "Consultar Financiación / Cuotas" → +54 2945 69-0678 (`src/lib/config.ts`, mensajes en `src/lib/whatsapp.ts`).

## Desarrollo

```bash
cp .env.example .env.local   # opcional
npm install
npm run dev
```

## Deploy

Pensado para Vercel: importar el repo, sin configuración extra. Variables opcionales en `.env.example`.

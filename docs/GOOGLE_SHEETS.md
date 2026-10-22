# Estructura recomendada del Google Sheets

La tienda lee la planilla `GOOGLE_SHEET_ID` cada 60 s. Las columnas se detectan **por el nombre del encabezado** (no por la posición), así que el orden es libre. Usá los nombres exactos de abajo: minúsculas, sin acentos y con `_`.

Plantillas listas para importar (Archivo → Importar → Subir): [`plantilla-catalogo.csv`](./plantilla-catalogo.csv) y [`plantilla-testimonios.csv`](./plantilla-testimonios.csv).

## Pestaña `Catalogo`

Una fila de encabezados en la fila 1 y un producto por fila. No dejes filas de títulos ni celdas combinadas arriba de los encabezados.

| Columna | ¿Obligatoria? | Valores | Ejemplo |
|---|---|---|---|
| `id` | Recomendada | Código único del producto (no se repite) | `IP15PM-256` |
| `titulo` | **Sí** | Modelo + color. Para iPhones empezá con `iPhone` y el número (`iPhone 15 Pro Max`); el color en el título elige el render cuando no hay foto | `iPhone 15 Pro Max Titanio Natural` |
| `categoria` | Recomendada | `iPhones`, `Accesorios` o `Combos`. Vacía → se deduce del título | `iPhones` |
| `almacenamiento` | Opcional | `64 GB`, `128 GB`, `256 GB`, `512 GB`, `1 TB` (también acepta `128gb`) | `256 GB` |
| `condicion` | Opcional | `Nuevo`, `Nuevo sellado`, `Usado`, `Reacondicionado A+`… (alimenta el filtro Nuevo/Usado) | `Usado` |
| `precio_usd` | **Sí** | Precio contado en USD, solo el número | `1050` |
| `precio_oferta` | Opcional | Precio de oferta en USD (menor a `precio_usd`). Si tiene valor, el producto es oferta y muestra el % de descuento | `990` |
| `bateria` | Opcional (iPhones) | `100%`, `90%`, `88`, `0,88`. Vacía o `consultar` → etiqueta "Batería: ¡consultanos!" que abre WhatsApp | `100%` |
| `stock` | Recomendada | **Número de unidades** (`0` = Agotado, `1` = "¡Último en stock!", `2+` = Disponible) **o texto**: `Disponible`, `Agotado`, `Vendido`, `Reservado`, `Sin stock`, `Últimas unidades`, `Stock limitado`. Vacía → Disponible | `1` |
| `imagen_url` | Opcional | Link directo a la foto o link de Google Drive ("cualquiera con el enlace") | `https://drive.google.com/file/d/…/view` |
| `es_oferta` | Opcional | `si` / `x` para destacar en "Ofertas" sin precio de oferta; `no` para quitarla | `si` |

Notas:

- **`estado`**: si no usás `stock`, la columna `estado` sirve para la disponibilidad (`Disponible` / `Agotado` / `Último`). Si `estado` tiene otra cosa (`Excelente`, `Como nuevo`) se muestra como chip del estado estético del equipo.
- **"¡Último en stock!"** aparece cuando `stock` = `1` o el texto dice *último / última unidad / pocas unidades / stock limitado*.
- Los productos agotados se muestran atenuados y sin botón de compra (siguen visibles dentro de su modelo).
- Precios en pesos: si no hay columna `precio_usd`, se toma `Precio Contado ($)` y se convierte con la cotización (`USD_ARS_RATE` o dolarapi.com).
- **Orden**: no hace falta ordenar la planilla. La web agrupa y ordena sola: iPhones del más nuevo al más viejo (17 → 11, X, SE), dentro de cada generación Pro Max → Pro → Plus → base → mini/e, y luego por capacidad. El visitante puede elegir "Desde iPhone 11" para verlos al revés.

## Pestaña `Testimonios`

| Columna | ¿Obligatoria? | Valores | Ejemplo |
|---|---|---|---|
| `testimonio` | **Sí** | Texto de la reseña (sin comillas) | `Excelente atención, el equipo llegó impecable.` |
| `cliente` | Recomendada | Nombre o inicial | `Juan P.` |
| `ciudad` | Opcional | Localidad | `Esquel` |
| `estrellas` | Opcional | `1`–`5` o ⭐⭐⭐⭐⭐ | `5` |
| `captura_url` | Opcional | Captura del chat/Instagram (link directo o Drive) | `https://drive.google.com/file/d/…/view` |

La sección "Lo que dicen de nosotros" solo aparece si hay al menos un testimonio cargado. También funciona como un bloque debajo del catálogo en la misma pestaña (dejá una fila vacía y poné la fila de encabezados `testimonio, cliente, …`).

## Cómo conectar las pestañas

- **Con `GOOGLE_SHEETS_API_KEY`** (recomendado): se leen **todas las pestañas** automáticamente. `GOOGLE_SHEET_RANGE` solo hace falta para limitar el rango (`Catalogo!A1:K300,Testimonios!A1:E100`).
- **Sin API key** (export CSV público, la hoja compartida como "cualquiera con el enlace puede ver"): poné en `GOOGLE_SHEET_GID` los `gid` de cada pestaña separados por coma, por ejemplo `GOOGLE_SHEET_GID="0,123456789"` (el número después de `gid=` en la URL al abrir cada pestaña).

## Buenas prácticas para que no se desordene

1. No cambies los nombres de los encabezados; agregar columnas extra (costos, notas internas) no rompe nada, se ignoran.
2. Un producto por fila; para dos unidades iguales usá `stock` = `2` en lugar de duplicar la fila.
3. Precios solo con números (`1050`, no `USD 1.050 aprox`).
4. Fotos: 3:2 horizontal (ej. 1200×800), equipo centrado sobre fondo liso, sin textos encima. `/api/product-image` quita fondos lisos o transparentes y encuadra cualquier otra foto en 3:2 sin deformarla (las verticales se muestran completas sobre un fondo desenfocado).
5. Activá "Datos → Validación de datos" en `categoria` (`iPhones, Accesorios, Combos`) y `es_oferta` (`si, no`) para evitar errores de tipeo.

## Simulador de cuotas (Mercado Pago)

Cada tarjeta calcula 3, 6, 9 y 12 cuotas sobre el precio en pesos (`precio` × cotización del dólar de la tienda). Los recargos son **estimados** y se configuran con `MP_CUOTAS_RECARGO` (porcentaje total sobre el contado), por defecto `3:20,6:35,9:50,12:65`. Actualizalos con los costos de financiación vigentes de tu cuenta de Mercado Pago.

## Analytics

- `NEXT_PUBLIC_GA_ID` (`G-XXXXXXX`): GA4. Eventos: `whatsapp_click` (parámetro `intent`: `contado`, `financiacion`, `consulta`, `comprobante`), `generate_lead` (contado y financiación), `begin_checkout` (transferencia), `installments_simulator_open` / `installments_simulator_select`. Marcá `generate_lead` como evento clave (conversión) en GA4.
- `NEXT_PUBLIC_META_PIXEL_ID`: Meta Pixel. `PageView`, `Lead` (contado / financiación / comprobante), `InitiateCheckout` (transferencia), `Contact` (consultas) y los mismos eventos personalizados.

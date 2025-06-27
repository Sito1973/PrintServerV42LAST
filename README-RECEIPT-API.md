# 📄 API de Recibos Avanzados - PrintServer V42

## 🔑 Autenticación

**API Key requerida**: Todas las peticiones deben incluir tu API key en el header `Authorization`

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoint Principal

**POST** `/api/print-receipt`

Endpoint para crear recibos con control total línea por línea, permitiendo mezclar texto, imágenes, códigos QR, productos y comandos ESC/POS personalizados.

## Headers Requeridos

```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

> **⚠️ Importante**: Sin la API key válida, recibirás un error 401 Unauthorized

## Estructura JSON Base

```json
{
  "printerId": 123,
  "documentName": "Mi Recibo Personalizado",
  "receipt": {
    "header": {
      "alignment": "center",
      "logo": {
        "data": "base64_image_data",
        "width": 200,
        "height": 100
      }
    },
    "lines": [
      // Array de líneas (ver tipos abajo)
    ],
    "footer": {
      "cut_paper": true,
      "open_drawer": true,
      "beep": {
        "enabled": true,
        "count": 2
      },
      "feed_lines": 3
    }
  }
}
```

## 📝 Tipos de Líneas Disponibles

### 🎨 Opciones de Formato de Texto (Aplicables a TODOS los tipos que manejan texto)

**Estas opciones están disponibles para:** `text`, `product_header`, `product_line`, `total_line`, `payment_section`

```json
{
  "bold": true,           // Texto en negrita
  "doubleHeight": true,   // Doble altura
  "doubleWidth": true,    // Doble ancho  
  "underline": true,      // Subrayado
  "font": "A",           // Tipo de fuente (A, B, C)
  "alignment": "center"   // Alineación (left, center, right)
}
```

#### 🖨️ Ejemplos de Formato:

```
┌────────────────────────────────────────┐
│                                        │
│           TEXTO NORMAL                 │
│           TEXTO BOLD                   │
│     TEXTO DOBLE ALTURA                 │
│ TEXTO DOBLE ANCHO                      │
│           TEXTO SUBRAYADO              │
│                                        │
│     COMBO: BOLD + DOBLE ALTURA         │
│                                        │
└────────────────────────────────────────┘
```

### 1. **Texto** (`text`)
```json
{
  "type": "text",
  "content": "MI TIENDA S.A.",
  "bold": true,
  "doubleHeight": true,
  "doubleWidth": false,
  "underline": false,
  "alignment": "center",
  "font": "A"
}
```

**Opciones disponibles:**
- **alignment**: `"left"`, `"center"`, `"right"`
- **font**: `"A"`, `"B"`, `"C"` (Font A = normal, Font B = pequeña, Font C = condensada)

#### Ejemplo con diferentes fuentes:
```json
{
  "type": "text",
  "content": "Fuente A - Normal",
  "font": "A",
  "alignment": "center"
}
```

```json
{
  "type": "text", 
  "content": "Fuente B - Pequeña y compacta",
  "font": "B",
  "alignment": "center"
}
```

```json
{
  "type": "text",
  "content": "Fuente C - Condensada para más texto",
  "font": "C", 
  "alignment": "center"
}
```

#### 🖨️ Comparación Visual de Fuentes:

```
┌────────────────────────────────────────┐
│                                        │
│         Font A: MI RESTAURANTE         │
│      Font B: Información adicional     │
│   Font C: Texto condensado con más caracteres│
│                                        │
│         Font A (Bold): TOTAL           │
│     Font B (Bold): Subtotal info       │
│ Font C (Bold): Código de referencia larga   │
│                                        │
└────────────────────────────────────────┘
```

**Características de cada fuente:**
- **Font A**: Tamaño normal, fácil de leer, ideal para títulos y totales
- **Font B**: Más pequeña y compacta, ideal para información secundaria  
- **Font C**: Condensada, permite más caracteres por línea, ideal para descripciones largas

### 2. **Separador** (`separator`)
```json
{
  "type": "separator",
  "char": "-",
  "length": 40
}
```

### 3. **Salto de Línea** (`line_break`)
```json
{
  "type": "line_break",
  "count": 2
}
```

### 4. **Imagen** (`image`)
```json
{
  "type": "image",
  "data": "iVBORw0KGgoAAAANSUhEUgAAAH...",
  "alignment": "center",
  "width": 200,
  "height": 100
}
```

### 5. **Código QR** (`qr_code`)
```json
{
  "type": "qr_code",
  "data": "https://mitienda.com/factura/123",
  "size": 3,
  "alignment": "center"
}
```

### 6. **Encabezado de Productos** (`product_header`)
```json
{
  "type": "product_header",
  "columns": ["CANT", "DESCRIPCION", "V/UNIT", "V/TOTAL"],
  "widths": [4, 20, 8, 8],
  "bold": true,
  "underline": true,
  "font": "A",
  "alignment": "left"
}
```

**Ejemplo con formato:**
```json
{
  "type": "product_header",
  "columns": ["CANT", "DESCRIPCION", "V/UNIT", "V/TOTAL"],
  "widths": [4, 20, 8, 8],
  "bold": true,
  "doubleHeight": false,
  "underline": true,
  "font": "B"
}
```

### 🎯 **¿Es obligatorio el `widths` en `product_header`?**

**NO es obligatorio**, pero **SÍ es MUY recomendado** por estas razones:

✅ **Alineación perfecta**: Las columnas del header coinciden exactamente con las de los productos  
✅ **Consistencia visual**: El recibo se ve profesional y ordenado  
✅ **Control total**: Puedes ajustar cada columna según tus necesidades  

### 📏 **Ejemplo de alineación correcta:**

```
┌────┬────────────────────┬────────┬────────┐
│CANT│    DESCRIPCION     │ V/UNIT │V/TOTAL │  ← Header con widths: [4,20,8,8]
├────┼────────────────────┼────────┼────────┤
│3   │AREPA CHICHARRON    │  26.900│  80.700│  ← Product con widths: [4,20,8,8]
│2   │EMPANADA POLLO      │  15.500│  31.000│  ← Product con widths: [4,20,8,8]
└────┴────────────────────┴────────┴────────┘
```

### ❌ **Sin `widths` puede quedar desalineado:**

```
┌──────────────────────────────────────────┐
│CANT DESCRIPCION V/UNIT V/TOTAL          │  ← Header sin widths
├──────────────────────────────────────────┤
│3   │AREPA CHICHARRON    │  26.900│  80.700│  ← Product con widths
│2   │EMPANADA POLLO      │  15.500│  31.000│  ← Desalineación!
└──────────────────────────────────────────┘
```

### 7. **Línea de Producto** (`product_line`)
```json
{
  "type": "product_line",
  "quantity": 3,
  "description": "AREPA CHICHARRON",
  "unit_price": 26900,
  "total_price": 80700,
  "currency": "$",
  "locale": "co",
  "showCurrency": false,
  "widths": [4, 20, 8, 8],
  "bold": false,
  "font": "B"
}
```

**Ejemplo producto destacado:**
```json
{
  "type": "product_line",
  "quantity": 1,
  "description": "★ PLATO ESPECIAL ★",
  "unit_price": 125000,
  "total_price": 125000,
  "currency": "$",
  "locale": "co",
  "showCurrency": false,
  "widths": [4, 20, 8, 8],
  "bold": true,
  "doubleHeight": true,
  "font": "A"
}
```

**Opciones de formato:**
- **locale**: `"co"` (Colombia - punto para miles, sin decimales), `"us"` (decimales con punto), `"eu"` (decimales con coma)
- **currency**: `"$"`, `"COP"`, `"USD"`, etc.
- **showCurrency**: `true` (mostrar símbolo) / `false` (solo números) - Por defecto `true`
- **bold**, **doubleHeight**, **doubleWidth**, **underline**, **font**, **alignment**: Formato de texto

#### 📏 Distribución de Ancho por Columnas (Total: 40 caracteres)

```
┌────┬────────────────────┬────────┬────────┐
│CANT│    DESCRIPCION     │ V/UNIT │V/TOTAL │
│ 4  │        20          │   8    │   8    │
├────┼────────────────────┼────────┼────────┤
│3   │AREPA CHICHARRON    │ $26.900│ $80.700│
│2   │EMPANADA POLLO      │ $15.500│ $31.000│
│5   │CAFE CON LECHE      │  $8.200│ $41.000│

**🇨🇴 Formato Colombia con símbolo (showCurrency: true):**
│3   │AREPA CHICHARRON    │ $26.900│ $80.700│
│12  │BANDEJA PAISA       │$125.000│$1.500.000│
│1   │SANCOCHO            │ $45.000│ $45.000│

**🇨🇴 Formato Colombia sin símbolo (showCurrency: false):**
│3   │AREPA CHICHARRON    │  26.900│  80.700│
│12  │BANDEJA PAISA       │ 125.000│1.500.000│
│1   │SANCOCHO            │  45.000│  45.000│
└────┴────────────────────┴────────┴────────┘
  4 +        20         +    8   +    8   = 40
```

**Configuración detallada:**
- **CANT**: 4 caracteres (suficiente para "999 ")
- **DESCRIPCION**: 20 caracteres (se trunca si es más largo)
- **V/UNIT**: 8 caracteres (incluye símbolo de moneda)
- **V/TOTAL**: 8 caracteres (incluye símbolo de moneda)

#### 🎛️ Personalizando el Ancho:

**Para impresoras de 32 caracteres (58mm):**
```json
{
  "type": "product_line",
  "quantity": 3,
  "description": "AREPA CHICHARRON",
  "unit_price": 26900,
  "total_price": 80700,
  "currency": "$",
  "locale": "co",
  "widths": [3, 15, 7, 7]
}
```

**Para impresoras de 48 caracteres:**
```json
{
  "type": "product_line", 
  "quantity": 3,
  "description": "AREPA CHICHARRON ESPECIAL",
  "unit_price": 26900,
  "total_price": 80700,
  "currency": "$",
  "locale": "co",
  "widths": [4, 28, 8, 8]
}
```

#### 🇨🇴 Ejemplos para Colombia:

**Precios sin decimales con separador de miles:**
```json
{
  "type": "product_line",
  "quantity": 1,
  "description": "BANDEJA PAISA",
  "unit_price": 125000,
  "total_price": 125000,
  "currency": "$",
  "locale": "co"
}
```
**Resultado**: `$125.000`

**Precios grandes:**
```json
{
  "type": "product_line", 
  "quantity": 5,
  "description": "COMBO FAMILIAR",
  "unit_price": 1500000,
  "total_price": 7500000,
  "currency": "$",
  "locale": "co"
}
```
**Resultado**: `$1.500.000` y `$7.500.000`

#### 💡 Consejos de Distribución:

**Distribuciones recomendadas por tamaño de impresora:**

| Impresora | Ancho Total | CANT | DESC | V/UNIT | V/TOTAL |
|-----------|-------------|------|------|--------|---------|
| 58mm      | 32 chars    | 3    | 15   | 7      | 7       |
| 80mm      | 40 chars    | 4    | 20   | 8      | 8       |
| 112mm     | 48 chars    | 4    | 28   | 8      | 8       |

### 8. **Línea de Total** (`total_line`)
```json
{
  "type": "total_line",
  "label": "SUBTOTAL",
  "value": 152700,
  "currency": "$",
  "bold": true,
  "alignment": "right",
  "locale": "co"
}
```

**Ejemplos de formato por locale:**
- **Colombia** (`"locale": "co"`): `$152.700` (sin decimales, punto para miles)
- **Estados Unidos** (`"locale": "us"`): `$152.70` (decimales con punto)
- **Europa** (`"locale": "eu"`): `$152,70` (decimales con coma)

### 9. **Separador para Totales** (`separator_total`)
```json
{
  "type": "separator_total",
  "char": "-",
  "length": 15,
  "alignment": "right"
}
```

### 10. **Sección de Pagos** (`payment_section`)
```json
{
  "type": "payment_section",
  "title": "FORMA DE PAGO:",
  "payments": [
    {
      "method": "TARJETA",
      "amount": 164916,
      "currency": "$"
    },
    {
      "method": "EFECTIVO",
      "amount": 50000,
      "currency": "$"
    }
  ],
  "bold": true,
  "font": "A",
  "alignment": "left"
}
```

**Ejemplo con formato destacado:**
```json
{
  "type": "payment_section",
  "title": "💳 FORMA DE PAGO:",
  "payments": [
    {
      "method": "TARJETA DÉBITO",
      "amount": 164916,
      "currency": "$"
    }
  ],
  "bold": true,
  "doubleHeight": true,
  "underline": true,
  "font": "A",
  "alignment": "center"
}
```

### 11. **Código de Barras** (`barcode`)
```json
{
  "type": "barcode",
  "data": "123456789012",
  "height": 50,
  "alignment": "center"
}
```

### 12. **Comandos ESC/POS Personalizados** (`custom_escpos`)
```json
{
  "type": "custom_escpos",
  "commands": [
    "\\x1B\\x40",              
    "\\x1B\\x61\\x01",          
    "\\x1B\\x21\\x30",          
    "OFERTA ESPECIAL",
    "\\x1B\\x21\\x00",          
    "\\x1B\\x61\\x00"           
  ]
}
```

## 🏪 Ejemplo Completo: Recibo de Restaurante

### 🖨️ Resultado Visual del Recibo:

```
┌────────────────────────────────────────┐
│               [🍕 LOGO]                │
│                                        │
│        RESTAURANTE LA DELICIA          │
│            RFC: DEL123456789           │
│         Calle Principal #123, Ciudad   │
│                                        │
│========================================│
│                                        │
│TICKET: 001234                          │
│FECHA: 27/06/2025 14:30                 │
│MESERO: Juan Pérez                      │
│                                        │
│----------------------------------------│
│CANT DESCRIPCION      V/UNIT   V/TOTAL │
│----------------------------------------│
│3    AREPA CHICHARRON   26.900   80.700│
│2    EMPANADA POLLO     15.500   31.000│
│5    CAFE CON LECHE      8.200   41.000│
│                                        │
│                    SUBTOTAL   $152.700│
│                     INC 8%    $12.216│
│                              --------│
│                      TOTAL   $164.916│
│                                        │
│FORMA DE PAGO:                          │
│TARJETA $164.916                        │
│                                        │
│                                        │
│        ¡GRACIAS POR SU VISITA!         │
│                                        │
│              [QR CODE]                 │
│           ████████████████             │
│           ██          ██               │
│           ██  ██████  ██               │
│           ██  ██████  ██               │
│           ██          ██               │
│           ████████████████             │
│                                        │
│        Califícanos escaneando el QR    │
│                                        │
│                                        │
│                                        │
└────[CORTE]────────────────────────────┘
          💰 [CAJÓN SE ABRE]
          🔊 [BEEP SONORO]
```

### 📱 JSON Request:

```json
{
  "printerId": 123,
  "documentName": "Recibo Restaurante",
  "receipt": {
    "header": {
      "alignment": "center",
      "logo": {
        "data": "base64_logo_restaurante",
        "width": 150,
        "height": 80
      }
    },
    "lines": [
      {
        "type": "text",
        "content": "RESTAURANTE LA DELICIA",
        "bold": true,
        "doubleHeight": true,
        "alignment": "center"
      },
      {
        "type": "text",
        "content": "RFC: DEL123456789",
        "alignment": "center"
      },
      {
        "type": "text",
        "content": "Calle Principal #123, Ciudad",
        "alignment": "center"
      },
      {
        "type": "separator",
        "char": "=",
        "length": 40
      },
      {
        "type": "text",
        "content": "TICKET: 001234",
        "bold": true,
        "alignment": "left"
      },
      {
        "type": "text",
        "content": "FECHA: 27/06/2025 14:30",
        "alignment": "left"
      },
      {
        "type": "text",
        "content": "MESERO: Juan Pérez",
        "alignment": "left"
      },
      {
        "type": "separator",
        "char": "-",
        "length": 40
      },
      {
        "type": "product_header",
        "columns": ["CANT", "DESCRIPCION", "V/UNIT", "V/TOTAL"],
        "widths": [4, 20, 8, 8],
        "bold": true,
        "underline": true
      },
      {
        "type": "separator",
        "char": "-",
        "length": 40
      },
      {
        "type": "product_line",
        "quantity": 3,
        "description": "AREPA CHICHARRON",
        "unit_price": 26900,
        "total_price": 80700,
        "currency": "$",
        "locale": "co",
        "showCurrency": false,
        "widths": [4, 20, 8, 8]
      },
      {
        "type": "product_line",
        "quantity": 2,
        "description": "EMPANADA POLLO",
        "unit_price": 15500,
        "total_price": 31000,
        "currency": "$",
        "locale": "co",
        "showCurrency": false,
        "widths": [4, 20, 8, 8]
      },
      {
        "type": "product_line",
        "quantity": 5,
        "description": "CAFE CON LECHE",
        "unit_price": 8200,
        "total_price": 41000,
        "currency": "$",
        "locale": "co",
        "showCurrency": false,
        "widths": [4, 20, 8, 8]
      },
      {
        "type": "line_break",
        "count": 1
      },
      {
        "type": "total_line",
        "label": "SUBTOTAL",
        "value": 152700,
        "currency": "$",
        "alignment": "right",
        "locale": "co"
      },
      {
        "type": "total_line",
        "label": "INC 8%",
        "value": 12216,
        "currency": "$",
        "alignment": "right",
        "locale": "co"
      },
      {
        "type": "separator_total",
        "char": "-",
        "length": 15,
        "alignment": "right"
      },
      {
        "type": "total_line",
        "label": "TOTAL",
        "value": 164916,
        "currency": "$",
        "bold": true,
        "alignment": "right",
        "locale": "co"
      },
      {
        "type": "line_break",
        "count": 1
      },
      {
        "type": "payment_section",
        "title": "FORMA DE PAGO:",
        "payments": [
          {
            "method": "TARJETA",
            "amount": 164916,
            "currency": "$"
          }
        ]
      },
      {
        "type": "line_break",
        "count": 2
      },
      {
        "type": "text",
        "content": "¡GRACIAS POR SU VISITA!",
        "bold": true,
        "alignment": "center"
      },
      {
        "type": "line_break",
        "count": 1
      },
      {
        "type": "qr_code",
        "data": "https://restaurante.com/feedback/001234",
        "size": 3
      },
      {
        "type": "line_break",
        "count": 1
      },
      {
        "type": "text",
        "content": "Califícanos escaneando el QR",
        "alignment": "center"
      }
    ],
    "footer": {
      "cut_paper": true,
      "open_drawer": true,
      "beep": {
        "enabled": true,
        "count": 1
      },
      "feed_lines": 3
    }
  }
}
```

## 🎨 Ejemplo Avanzado: Recibo con Promociones

```json
{
  "printerId": 123,
  "documentName": "Recibo con Promoción",
  "receipt": {
    "lines": [
      {
        "type": "image",
        "data": "base64_logo_principal",
        "alignment": "center",
        "width": 200
      },
      {
        "type": "text",
        "content": "SUPER MERCADO CENTRAL",
        "bold": true,
        "doubleHeight": true,
        "alignment": "center"
      },
      {
        "type": "custom_escpos",
        "commands": ["\\x1B\\x45\\x01", "★ OFERTA ESPECIAL ★", "\\x1B\\x45\\x00"]
      },
      {
        "type": "image",
        "data": "base64_banner_promocion",
        "alignment": "center",
        "width": 150
      },
      {
        "type": "separator",
        "char": "=",
        "length": 40
      },
      {
        "type": "product_line",
        "quantity": 1,
        "description": "LECHE ENTERA 1L",
        "unit_price": 12500,
        "total_price": 12500,
        "currency": "$",
        "locale": "co",
        "showCurrency": false,
        "widths": [4, 20, 8, 8]
      },
      {
        "type": "product_line",
        "quantity": 2,
        "description": "PAN INTEGRAL",
        "unit_price": 8000,
        "total_price": 16000,
        "currency": "$",
        "locale": "co",
        "showCurrency": false,
        "widths": [4, 20, 8, 8]
      },
      {
        "type": "custom_escpos",
        "commands": ["\\x1B\\x61\\x01", "--- DESCUENTO 10% ---", "\\x1B\\x61\\x00"]
      },
      {
        "type": "total_line",
        "label": "SUBTOTAL",
        "value": 28500,
        "currency": "$",
        "alignment": "right",
        "locale": "co"
      },
      {
        "type": "total_line",
        "label": "DESCUENTO",
        "value": -2850,
        "currency": "$",
        "alignment": "right",
        "locale": "co"
      },
      {
        "type": "total_line",
        "label": "TOTAL",
        "value": 25650,
        "currency": "$",
        "bold": true,
        "alignment": "right",
        "locale": "co"
      },
      {
        "type": "barcode",
        "data": "7501234567890",
        "height": 50,
        "alignment": "center"
      },
      {
        "type": "text",
        "content": "Código de seguimiento",
        "alignment": "center"
      }
    ],
    "footer": {
      "cut_paper": true,
      "feed_lines": 2
    }
  }
}
```

## 📋 Respuesta Exitosa

```json
{
  "success": true,
  "message": "Recibo avanzado enviado a impresora 'EPSON TM-T20III'",
  "jobId": 12345,
  "documentName": "Recibo Restaurante",
  "printerName": "EPSON TM-T20III",
  "linesProcessed": 25,
  "hasHeader": true,
  "hasFooter": true,
  "notifiedViaWebSocket": true
}
```

## ❌ Errores Comunes

### 400 - Bad Request
```json
{
  "message": "Se requieren printerId y receipt.lines (array)"
}
```

### 401 - Unauthorized
```json
{
  "message": "Clave API inválida"
}
```

### 404 - Not Found
```json
{
  "message": "Impresora no encontrada"
}
```

### 500 - Server Error
```json
{
  "error": "Error al procesar recibo avanzado",
  "details": "Detalles específicos del error"
}
```

## 🔧 Consejos de Implementación

### 1. **Optimización de Imágenes**
- Usa imágenes en formato PNG o JPG
- Mantén las imágenes bajo 200KB
- Ancho recomendado: 200-300px para impresoras térmicas

### 2. **Ancho de Columnas**
- Impresoras de 80mm: Total ~40 caracteres
- Impresoras de 58mm: Total ~32 caracteres
- Ajusta los arrays `widths` según tu impresora

### 3. **Comandos ESC/POS Personalizados**
- Usa secuencias de escape válidas
- Siempre reinicia el formato después de cambios
- Documenta comandos personalizados para mantenimiento

### 4. **Rendimiento**
- Agrupa comandos similares cuando sea posible
- Evita múltiples cambios de formato innecesarios
- Usa `line_break` en lugar de múltiples `\n`

## 🚀 Casos de Uso Recomendados

- **Restaurantes**: Menús, órdenes, facturas
- **Retail**: Recibos de venta, promociones  
- **Farmacias**: Recetas, advertencias médicas
- **Eventos**: Tickets, pases, cupones
- **Servicios**: Facturas profesionales, cotizaciones

---

**Endpoint creado para PrintServer V42** 🖨️  
*Control total sobre cada línea de tu recibo*
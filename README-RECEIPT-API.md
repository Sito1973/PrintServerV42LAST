# 🚀 API de Recibos Avanzados - PrintServer V42

<div align="center">

![PrintServer V42](https://img.shields.io/badge/PrintServer-V42-blue?style=for-the-badge)
![API](https://img.shields.io/badge/API-Receipt-green?style=for-the-badge)
![ESC/POS](https://img.shields.io/badge/ESC%2FPOS-Compatible-orange?style=for-the-badge)

**Control total línea por línea para recibos profesionales**

</div>

---

## 🎯 Descripción

La API de Recibos Avanzados te permite crear documentos con **control granular** sobre cada elemento: texto, imágenes, códigos QR, productos, totales y comandos ESC/POS personalizados.

### ✨ Características principales

- 🎨 **12 tipos de elementos** diferentes
- 📱 **Códigos QR dinámicos** con tamaño configurable  
- 🖼️ **Imágenes y logos** en Base64
- 💰 **Formatos de moneda** por país (CO, US, EU)
- 📊 **Productos con columnas** alineadas perfectamente
- 🎛️ **Comandos ESC/POS** personalizados
- 🔧 **Formato de texto** completo (negrita, doble altura, subrayado)

---

## 🔐 Autenticación

```http
POST /api/print-receipt
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE
```

> 🔑 **Importante**: Incluye tu API key en el header `x-api-key`

---

## 📋 Estructura Base

```json
{
  "printerId": 123,
  "documentName": "Mi Recibo Personalizado",
  "receipt": {
    "lines": [
      // Array de elementos (ver tipos abajo)
    ],
    "footer": {
      "feed_lines": 6,
      "cut_paper": true,
      "open_drawer": true,
      "beep": {
        "enabled": true,
        "count": 2
      }
    }
  }
}
```

### 🔧 Opciones del Footer

| Opción | Tipo | Descripción | Ejemplo |
|--------|------|-------------|---------|
| `feed_lines` | `number` | Líneas en blanco al final | `6` |
| `cut_paper` | `boolean` | Cortar papel automáticamente | `true` |
| `open_drawer` | `boolean` | Abrir cajón de dinero | `true` |
| `beep.enabled` | `boolean` | Activar sonido | `true` |
| `beep.count` | `number` | Número de beeps (1-9) | `2` |

> 💡 **Tip**: Todas las opciones del footer son opcionales

---

## 🧩 Tipos de Elementos

### 1. 📝 **Texto** (`text`)

```json
{
  "type": "text",
  "content": "MI TIENDA S.A.",
  "bold": true,
  "doubleHeight": true,
  "alignment": "center",
  "font": "A"
}
```

**Opciones de formato:**
- `alignment`: `"left"` | `"center"` | `"right"`
- `font`: `"A"` (normal) | `"B"` (pequeña) | `"C"` (condensada)
- `bold`: `true` | `false`
- `doubleHeight`: `true` | `false`
- `doubleWidth`: `true` | `false`
- `underline`: `true` | `false`

---

### 2. ➖ **Separador** (`separator`)

```json
{
  "type": "separator",
  "char": "-",
  "length": 40
}
```

---

### 3. ⬇️ **Salto de línea** (`line_break`)

```json
{
  "type": "line_break",
  "count": 2
}
```

---

### 4. 🖼️ **Imagen/Logo** (`image`)

```json
{
  "type": "image",
  "data": "iVBORw0KGgoAAAANSUhEUgAAAH...",
  "width": 200,
  "height": 100
}
```

> 💡 **Tip**: La imagen debe estar en **Base64** sin el prefijo `data:image/...;base64,`

---

### 5. 📱 **Código QR** (`qr_code`)

```json
{
  "type": "qr_code",
  "data": "https://mitienda.com/factura/123",
  "size": 3
}
```

**Tamaños disponibles:**
- `1` = Muy pequeño
- `3` = Pequeño (recomendado)
- `6` = Mediano
- `9` = Grande
- `12` = Muy grande

---

### 6. 📊 **Encabezado de productos** (`product_header`)

```json
{
  "type": "product_header",
  "columns": ["CANT", "DESCRIPCION", "V/UNIT", "V/TOTAL"],
  "widths": [4, 20, 8, 8],
  "bold": true,
  "underline": true
}
```

---

### 7. 🛍️ **Línea de producto** (`product_line`)

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
  "widths": [4, 20, 8, 8]
}
```

**Formatos por país:**
- `"locale": "co"` → Colombia: `26.900` (sin decimales, punto separador)
- `"locale": "us"` → Estados Unidos: `26.90` (decimales con punto)
- `"locale": "eu"` → Europa: `26,90` (decimales con coma)

---

### 8. 💰 **Línea de total** (`total_line`)

```json
{
  "type": "total_line",
  "label": "TOTAL",
  "value": 164916,
  "currency": "$",
  "bold": true,
  "alignment": "right",
  "locale": "co"
}
```

---

### 9. 💳 **Sección de pagos** (`payment_section`)

```json
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
}
```

---

### 10. 📦 **Código de barras** (`barcode`)

```json
{
  "type": "barcode",
  "data": "123456789012",
  "height": 50,
  "alignment": "center"
}
```

---

### 11. ⚡ **Comandos ESC/POS** (`custom_escpos`)

```json
{
  "type": "custom_escpos",
  "commands": [
    "\\x1B\\x40",              
    "\\x1B\\x61\\x01",          
    "TEXTO PERSONALIZADO",
    "\\x1B\\x61\\x00"           
  ]
}
```

---

## 🎯 Ejemplo Completo: Restaurante

<details>
<summary>👆 <strong>Clic para ver el JSON completo</strong></summary>

```json
{
  "printerId": 123,
  "documentName": "Recibo Restaurante",
  "receipt": {
    "lines": [
      {
        "type": "image",
        "data": "iVBORw0KGgoAAAANSUhEUgAAAH...",
        "width": 150,
        "height": 80
      },
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
        "type": "separator",
        "char": "=",
        "length": 40
      },
      {
        "type": "text",
        "content": "TICKET: 001234",
        "bold": true
      },
      {
        "type": "text",
        "content": "FECHA: 27/06/2025 14:30"
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
        "label": "IVA 8%",
        "value": 12216,
        "currency": "$",
        "alignment": "right",
        "locale": "co"
      },
      {
        "type": "total_line",
        "label": "TOTAL",
        "value": 164916,
        "currency": "$",
        "bold": true,
        "doubleHeight": true,
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
        "type": "qr_code",
        "data": "https://restaurante.com/feedback/001234",
        "size": 3
      },
      {
        "type": "text",
        "content": "Califícanos escaneando el QR",
        "alignment": "center"
      }
    ],
    "footer": {
      "feed_lines": 6,
      "cut_paper": true,
      "open_drawer": true,
      "beep": {
        "enabled": true,
        "count": 2
      }
    }
  }
}
```

</details>

### 🖨️ Resultado visual

```
┌────────────────────────────────────────┐
│               [🍕 LOGO]                │
│                                        │
│        RESTAURANTE LA DELICIA          │
│            RFC: DEL123456789           │
│                                        │
│========================================│
│                                        │
│TICKET: 001234                          │
│FECHA: 27/06/2025 14:30                 │
│                                        │
│----------------------------------------│
│CANT DESCRIPCION      V/UNIT   V/TOTAL │
│----------------------------------------│
│3    AREPA CHICHARRON   26.900   80.700│
│2    EMPANADA POLLO     15.500   31.000│
│                                        │
│                    SUBTOTAL   $152.700│
│                     IVA 8%    $12.216│
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
│           ██          ██               │
│           ████████████████             │
│                                        │
│        Califícanos escaneando el QR    │
│                                        │
│                                        │
│                                        │
│                                        │
│                                        │
│                                        │
└────[CORTE]────────────────────────────┘
          💰 [CAJÓN SE ABRE]
          🔊 [BEEP BEEP]
```

---

## 📏 Guía de Anchos por Impresora

| Tipo de Impresora | Ancho Total | CANT | DESCRIPCION | V/UNIT | V/TOTAL |
|-------------------|-------------|------|-------------|--------|---------|
| **58mm** | 32 chars | 3 | 15 | 7 | 7 |
| **80mm** | 40 chars | 4 | 20 | 8 | 8 |
| **112mm** | 48 chars | 4 | 28 | 8 | 8 |

---

## ✅ Respuesta Exitosa

```json
{
  "success": true,
  "message": "Recibo avanzado enviado a impresora 'EPSON TM-T20III'",
  "jobId": 12345,
  "documentName": "Recibo Restaurante",
  "printerName": "EPSON TM-T20III",
  "linesProcessed": 25,
  "notifiedViaWebSocket": true
}
```

---

## ❌ Códigos de Error

| Código | Descripción | Solución |
|--------|-------------|----------|
| **400** | Datos faltantes | Verifica `printerId` y `receipt.lines` |
| **401** | API key inválida | Revisa el header `x-api-key` |
| **404** | Impresora no encontrada | Verifica el `printerId` |
| **500** | Error del servidor | Contacta soporte técnico |

---

## 🎨 Casos de Uso

<div align="center">

| 🍽️ **Restaurantes** | 🛒 **Retail** | 💊 **Farmacias** | 🎫 **Eventos** |
|:-------------------:|:-------------:|:---------------:|:--------------:|
| Menús | Recibos de venta | Recetas | Tickets |
| Órdenes | Promociones | Advertencias | Pases |
| Facturas | Códigos QR | Instrucciones | Cupones |

</div>

---

## 🚀 Consejos Pro

### 💡 Optimización de imágenes
- Formato: **PNG** o **JPG**
- Tamaño máximo: **200KB**
- Ancho recomendado: **200-300px**

### 🎯 Alineación perfecta
- Usa los mismos `widths` en `product_header` y `product_line`
- Ajusta según el ancho de tu impresora
- Prueba con diferentes tamaños de QR

### ⚡ Rendimiento
- Agrupa comandos similares
- Evita cambios de formato innecesarios
- Usa `line_break` en lugar de múltiples `\n`

---

<div align="center">

**🖨️ PrintServer V42 - Receipt API**

*Control total sobre cada línea de tu recibo*

![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)

</div>
# V-ONE-B — rediseño de storefront

Prototipo navegable del sitio con la identidad del **Manual de marca V-ONE-B** aplicada,
usando el catálogo real de la tienda (754 productos, 34 colecciones).

## Correr

```bash
node site/server.js
```

→ http://localhost:3000 · Sin dependencias, sin paso de build. Node 18+.

## Qué cambia respecto de v-one-b.com

El sitio actual corre el tema **Trade 15.4.1** de Shopify con la configuración de fábrica:
fondo `#f4f4f4`, tipografía Jost, títulos de sección a 13px y un menú con más de 40 enlaces sueltos.
El manual de marca no está aplicado en ninguna parte.

| | Sitio actual | Este prototipo |
|---|---|---|
| Color | Gris `#f4f4f4` + texto gris | Negro de marca + rojo `#ED1D24` como acento, gris `#F4F4F4` en superficies de producto |
| Tipografía | Jost para todo | **Michroma** en display (equivalente web de Square 721 BdEx BT) + **Poppins** en texto |
| Jerarquía | `h2` a 13px | Escala fluida con `clamp()`, display hasta 5.6rem |
| Navegación | 40+ enlaces planos, tallas en el menú | 9 disciplinas; género, tipo y stock pasan a facetas filtrables |
| Portada | Grillas de producto encadenadas | Página 1 del manual como hero, tira de categorías, bandas editoriales, manifiesto |
| Logotipo | Texto con la fuente del tema | Trazado vectorial extraído del manual, en header, hero y footer |
| Ficha | Precio y variantes del tema | Galería, selector de talla con agotados tachados, acordeones de material/envío/postventa, similares |
| Búsqueda | Campo del tema | Overlay con ranking sobre título, tipo y etiquetas; atajo `/` |

## Decisiones de diseño

**La portada es la página 1 del manual.** Lienzo negro, resplandor rojo desde la esquina
inferior izquierda y el logotipo centrado. El resplandor sale del PDF tal cual
(`assets/brand/hero-glow.png`, 12 KB, con el logotipo redactado en negro): ninguna
combinación de `radial-gradient` lo reproducía — al medirla en diagonal se desviaba hasta
un 60%, porque la caída no es radial. El logotipo va encima como vector extraído del propio
PDF, así que son las letras reales de Square 721 BdEx BT y escalan nítidas. Verificado:
desviación 0 contra el PDF en los ocho puntos muestreados, y el logo a 30.3% del ancho
centrado en 50/50, igual que el original.

**Negro como lienzo, claro para producto.** El manual es negro; la fotografía de catálogo
está tirada sobre fondos claros. El sitio alterna: cromo negro (header, hero, bandas, footer)
y superficies claras donde va el producto, para que las fotos no se recorten visualmente.

**Dos rojos.** `#ED1D24` es el rojo de marca y se usa como acento gráfico y sobre negro (4.8:1).
Sobre fondos claros y como relleno con texto blanco no alcanza 4.5:1, así que ahí entra
`--red-ui: #c4141a` — mismo color percibido, contraste conforme. Está documentado en `css/app.css`.

**Cero radios.** Esquinas vivas en botones, chips y tarjetas: el logotipo es geométrico
y extendido, y el redondeo lo suaviza de más.

## Estructura

```
site/
├── server.js          Servidor estático + fallback SPA
├── index.html         Shell: header, footer, carrito, buscador
├── css/app.css        Sistema de diseño (tokens, componentes, responsive)
├── css/fonts.css      Michroma + Poppins self-hosted
├── fonts/             17 woff2 (289 KB)
├── js/app.js          Router, vistas, facetas, carrito, búsqueda
├── data/catalog.json  754 productos del catálogo real (557 KB)
└── assets/brand/      Piezas gráficas del manual
```

Las imágenes de producto se sirven desde el CDN de Shopify con `&width=` por breakpoint.

## Rutas

`/` · `/c/:disciplina` · `/p/:handle` · `/contacto` · `/envios` · `/politicas` · `/cuenta`

Filtros por query: `?t=` tipo · `?g=` género · `?d=1` en stock · `?s=` orden · `?n=` paginación.

## Verificado

- Contraste WCAG AA: 0 fallos en portada, colección, ficha, carrito y páginas de contenido.
- Objetivos táctiles: ninguno bajo 24px (WCAG 2.5.8).
- Sin desbordamiento horizontal a 375, 768 y 1440px.
- 754 fichas de producto resuelven con similares; 0 imágenes rotas sobre 75.
- Portada: 55 peticiones, ~1 MB (557 KB es el catálogo completo, que en producción sería server-side).

## Pendiente si esto avanza a producción

- Es un prototipo de front: el checkout y la cuenta muestran un aviso, no se conectan a Shopify.
- El contenido de la guía de tallas está sin definir.
- Redes sociales, WhatsApp y teléfono en el footer son marcadores.
- Para llevarlo a la tienda real hay dos caminos: portar este sistema a un tema Liquid,
  o montar un headless con la Storefront API. El CSS está escrito para traducirse directo a Liquid.

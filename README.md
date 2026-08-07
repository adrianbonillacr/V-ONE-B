# V-ONE-B

Rediseño del storefront de [v-one-b.com](https://www.v-one-b.com/) con la identidad del
manual de marca aplicada, sobre el catálogo real de la tienda.

```bash
node site/server.js
```

→ http://localhost:3000 · Sin dependencias, sin paso de build. Node 18+.

## Contenido

| Carpeta | Qué es |
|---|---|
| `site/` | El prototipo. Ver [site/README.md](site/README.md) para decisiones de diseño y estado. |
| `site/assets/brand/` | Las piezas gráficas que el sitio necesita para renderizar. |

La entrega original del diseñador (`Assets/`) y el PDF del manual de marca quedan
fuera del repositorio a propósito — ver `.gitignore`. Se trabajan en local.

## Marca

`#ED1D24` · `#000000` · `#F4F4F4` — display *Square 721 BdEx BT* (en web: Michroma),
texto en Poppins.

## Estado

Prototipo de front. El checkout y la cuenta no se conectan a Shopify todavía;
el detalle de lo pendiente está en [site/README.md](site/README.md).

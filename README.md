# V-ONE-B

Rediseño del storefront de [v-one-b.com](https://www.v-one-b.com/) con la identidad del
manual de marca aplicada, sobre el catálogo real de la tienda.

```bash
node site/server.js
```

→ http://localhost:3000 · Sin dependencias, sin paso de build. Node 18+.

## Deploy

El sitio es estático: `vercel.json` ya trae la configuración (sin build, `site/` como
salida, fallback SPA y cabeceras de caché). Para publicarlo en Vercel:

1. [vercel.com/new](https://vercel.com/new) → importar `adrianbonillacr/V-ONE-B`
2. Dejar todo por defecto — la configuración se lee de `vercel.json`
3. Deploy

O desde la terminal, en la raíz del proyecto:

```bash
npx vercel --prod
```

`site/server.js` es solo para desarrollo local; Vercel no lo usa.

### URLs y acceso

La URL de producción (`v-one-b.vercel.app`) es pública y es la que se comparte.
Las URLs con hash que Vercel genera por despliegue (`v-one-…-abc123.vercel.app`)
piden inicio de sesión: es Deployment Protection, activo por defecto. Para abrirlas
también: **Project Settings → Deployment Protection → Vercel Authentication → Disabled**.

Las cabeceras de caché de `/assets/` no usan `immutable` a propósito: esos nombres
de archivo no llevan hash de contenido, así que un año de caché inmutable dejaría a
los visitantes con un logotipo viejo si se cambia.

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

/* ═══════════════════════════════════════════════════════════
   V-ONE-B — app
   Router + vistas + facetas + carrito + búsqueda. Sin dependencias.
   ═══════════════════════════════════════════════════════════ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ── Arquitectura de información ───────────────────────────
   El sitio actual expone 40+ enlaces sueltos en el menú.
   Aquí el eje es el deporte; género/tipo/talla pasan a facetas. */
const NAV = [
  { slug: 'ciclismo',   label: 'Ciclismo',   cols: ['ciclismo', 'jersey', 'licras-de-ciclismo', 'guantes'], img: 'cyclist-editorial.png' },
  { slug: 'atletismo',  label: 'Atletismo',  cols: ['atletismo'], img: 'visor-lifestyle.png' },
  { slug: 'triatlon',   label: 'Triatlón',   cols: ['triatlon', 'enterizos-para-triatlon'], img: 'lineup-dark.png' },
  { slug: 'agua',       label: 'Natación & Surf', cols: ['natacion', 'surf', 'pantalonera-surf-mujer', 'pantalonetas-surf-hombre'], img: 'tee-wordmark.png' },
  { slug: 'trail',      label: 'Trail',      cols: ['montanismo-y-trail'], img: 'tee-olive-dark.png' },
  { slug: 'lifestyle',  label: 'Lifestyle',  cols: ['casual-y-active-wear', 'blusas-y-camisas', 'blusas-y-camisas-1', 'camisas', 'licras', 'licras-flare', 'licras-de-mujer'], img: 'crew-pink-dark.png' },
  { slug: 'accesorios', label: 'Accesorios', cols: ['accesorios', 'medias', 'gorras-accesorios'], img: 'socks-light.png' },
  { slug: 'costa-rica', label: 'Costa Rica', cols: ['coleccion-fauna-de-costa-rica', 'bandanas-del-camino-de-costa-rica', 'blusas-y-camisas-del-camino-de-costa-rica', 'bolsos-del-camino-de-costa-rica', 'bolsos-del-camino-de-costa-rica-1', 'sombreros-del-camino-de-costa-rica'], img: 'editorial-crew-light.png' },
  { slug: 'outlet',     label: 'Outlet',     cols: ['outlet'], img: 'lineup-light.png', red: true },
  // No es una colección sino un servicio: lleva a una página propia y por eso
  // no aparece en la tira de categorías ni abre flyout de producto.
  { slug: 'personalizacion', label: 'Personalización', href: '/personalizacion', page: true },
];
const NAVBY = Object.fromEntries(NAV.map(n => [n.slug, n]));

const GENDER = [
  { key: 'mujer',  label: 'Mujer',  re: /\b(mujer|dama|femenin)/ },
  { key: 'hombre', label: 'Hombre', re: /\b(hombre|caballero|masculin)/ },
  { key: 'nino',   label: 'Niños',  re: /(ni[ñn]o|ni[ñn]a|kids|infantil)/ },
];

/* ── Estado ───────────────────────────────────────────────── */
const S = { products: [], collections: {}, byHandle: new Map(), ready: null };
const CART_KEY = 'voneb.cart.v1';
let cart = load(CART_KEY, []);

function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } }

/* ── Utilidades ───────────────────────────────────────────── */
// Formato local: ₡ 30.000 (punto como separador de miles, como en la tienda actual).
const money = n => '₡ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Shopify usa "Default Title" cuando el producto no tiene opciones reales.
const DEFAULT_V = /^(default title|t[íi]tulo predeterminado)$/i;
const hasOptions = p => !(p.v.length === 1 && DEFAULT_V.test(p.v[0].t));
const vLabel = p => {
  if (!hasOptions(p)) return '';
  return /\b(xxs|xs|s|m|l|xl|xxl|xxxl|talla|\d{1,2})\b/i.test(p.v.map(v => v.t).join(' ')) ? 'Talla' : 'Opción';
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const imgW = (src, w) => (src || '').replace(/([?&])width=\d+/, `$1width=${w}`);
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><rect width="4" height="5" fill="#f4f4f4"/></svg>`);

function pic(p, i, w, cls, eager) {
  const src = p.img[i];
  if (!src) return '';
  return `<img class="${cls}" src="${imgW(src, w)}" alt="${esc(p.t)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"
    onerror="this.src='${PLACEHOLDER}'">`;
}

function gendersOf(p) {
  const hay = norm(p.tg.join(' ') + ' ' + p.t + ' ' + p.ty);
  return GENDER.filter(g => g.re.test(hay)).map(g => g.key);
}

function productsOf(slug) {
  const n = NAVBY[slug];
  if (!n || !n.cols) return [];
  const set = new Set(n.cols);
  return S.products.filter(p => p.c.some(h => set.has(h)));
}

/* ── Tarjeta ──────────────────────────────────────────────── */
function card(p, eager = false) {
  const sale = p.cmp > p.p;
  const isNew = (Date.now() - new Date(p.new)) / 864e5 < 45;
  const price = p.pmax > p.p
    ? `Desde ${money(p.p)}`
    : (sale ? `<span class="now">${money(p.p)}</span> <s>${money(p.cmp)}</s>` : money(p.p));

  const tags = [
    !p.av ? '<span class="tag tag--out">Agotado</span>' : '',
    sale ? '<span class="tag tag--red">Oferta</span>' : '',
    isNew && p.av && !sale ? '<span class="tag">Nuevo</span>' : '',
  ].filter(Boolean).join('');

  return `<article class="card">
    <div class="card__media ${p.img[1] ? '' : 'card__media--solo'}">
      ${pic(p, 0, 600, 'is-main', eager)}
      ${p.img[1] ? pic(p, 1, 600, 'is-alt') : ''}
      ${tags ? `<div class="card__tags">${tags}</div>` : ''}
      ${p.av ? `<div class="card__quick"><button class="btn btn--block js-quick" data-h="${p.h}">Agregar</button></div>` : ''}
    </div>
    <p class="card__ty">${esc(p.ty)}</p>
    <h3 class="card__t">${esc(p.t)}</h3>
    <p class="card__pr">${price}</p>
    <a class="card__hit" href="/p/${p.h}" data-link aria-label="${esc(p.t)}"></a>
  </article>`;
}

const gridOf = (list, eagerN = 4) =>
  `<div class="grid">${list.map((p, i) => card(p, i < eagerN)).join('')}</div>`;

/* ── Vista: Home ──────────────────────────────────────────── */
function viewHome() {
  const nuevos = S.products.filter(p => p.av && p.img.length).slice(0, 10);
  const ciclismo = productsOf('ciclismo').filter(p => p.av).slice(0, 5);
  const acc = productsOf('accesorios').filter(p => p.av).slice(0, 5);
  const oferta = S.products.filter(p => p.cmp > p.p && p.av).slice(0, 5);

  const cats = NAV.filter(n => !n.page && n.slug !== 'outlet').map((n, i) => `
    <a class="cat" href="/c/${n.slug}" data-link>
      <span class="cat__n">${String(i + 1).padStart(2, '0')}</span>
      <svg class="cat__ar" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ed1d24" stroke-width="1.5"><path d="M4 12L12 4M12 4H5.5M12 4v6.5"/></svg>
      <span class="cat__t">${esc(n.label)}</span>
    </a>`).join('');

  return `
  <section class="hero">
    <div class="hero__glow" aria-hidden="true"></div>
    <h1 class="hero__mark">
      <img src="/assets/brand/wordmark.svg" alt="V-ONE-B" width="587" height="76" fetchpriority="high">
    </h1>
    <p class="hero__tag">Colección 2026</p>
    <a class="hero__scroll" href="#cats" aria-label="Ver colecciones">
      <span>Explorar</span>
      <svg viewBox="0 0 16 26" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
        <path d="M8 1v22M2.5 17.5L8 23.5l5.5-6"/>
      </svg>
    </a>
  </section>

  <section class="dark" id="cats"><div class="cats">${cats}</div></section>

  <section class="sec snow rv">
    <div class="wrap">
      <div class="sec__hd">
        <div><p class="eyebrow">Recién llegado</p><h2 class="display display--sm">Lo nuevo</h2></div>
        <a class="link-u" href="/c/lifestyle" data-link>Ver todo</a>
      </div>
      ${gridOf(nuevos, 5)}
    </div>
  </section>

  <section class="split dark rv">
    <div class="split__img"><img src="/assets/brand/training-club.png" alt="Camiseta Training Club" loading="lazy"></div>
    <div class="split__txt on-dark">
      <p class="eyebrow eyebrow--red">Training Club</p>
      <h2 class="display display--sm">Equipación<br>sin excusas</h2>
      <p class="lede">Cada prenda nace de una necesidad real en ruta, pista o montaña.
        Cortes ergonómicos, costuras planas y telas que trabajan a favor del cuerpo.</p>
      <div class="ctas"><a class="btn btn--ghost-d" href="/c/atletismo" data-link>Explorar atletismo</a></div>
    </div>
  </section>

  <section class="sec light rv">
    <div class="wrap">
      <div class="sec__hd">
        <div><p class="eyebrow">Ruta y montaña</p><h2 class="display display--sm">Ciclismo</h2></div>
        <a class="link-u" href="/c/ciclismo" data-link>Ver todo</a>
      </div>
      ${gridOf(ciclismo, 0)}
    </div>
  </section>

  <section class="dark markband" aria-hidden="true">
    <div class="markband__track">${'<span>V-ONE-B</span><i>●</i>'.repeat(12)}</div>
  </section>

  <section class="sec snow rv">
    <div class="wrap">
      <div class="sec__hd">
        <div><p class="eyebrow">Detalle</p><h2 class="display display--sm">Accesorios</h2></div>
        <a class="link-u" href="/c/accesorios" data-link>Ver todo</a>
      </div>
      ${gridOf(acc, 0)}
    </div>
  </section>

  ${oferta.length ? `
  <section class="sec light rv">
    <div class="wrap">
      <div class="sec__hd">
        <div><p class="eyebrow eyebrow--red">Precio reducido</p><h2 class="display display--sm">Outlet</h2></div>
        <a class="link-u" href="/c/outlet" data-link>Ver todo</a>
      </div>
      ${gridOf(oferta, 0)}
    </div>
  </section>` : ''}

  <section class="sec--tight light rv">
    <div class="wrap"><div class="feats">
      ${[
        ['Telas de alto desempeño', 'Textiles importados con secado rápido y protección UV, seleccionados prenda por prenda.',
         '<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>'],
        ['Servicio post venta', 'Ajustes de talla y cambio de piezas después de la compra. La prenda se queda con vos.',
         '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>'],
        ['Envíos a todo el país', 'Correos de Costa Rica o mensajería privada, hasta tu casa u oficina.',
         '<path d="M2 8h11v9H2z"/><path d="M13 11h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'],
        ['Hecho en Costa Rica', 'Diseño y confección local, probados por atletas del país en ruta y competencia.',
         '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>'],
      ].map(([h, p, ic]) => `<div class="feat">
        <svg class="feat__ic" viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>
        <h3>${h}</h3><p>${p}</p></div>`).join('')}
    </div></div>
  </section>

  <section class="sec dark rv">
    <div class="wrap manifesto">
      <p class="eyebrow eyebrow--red">Manifiesto</p>
      <h2 class="display">No vendemos ropa.<br>Vendemos kilómetros.</h2>
      <p class="lede manifesto__sub">Desde 2018 fabricamos en San José para quienes entrenan de verdad.</p>
      <div class="ctas" style="justify-content:center"><a class="btn btn--red" href="/c/costa-rica" data-link>Colección Costa Rica</a></div>
    </div>
  </section>`;
}

/* ── Vista: Colección ─────────────────────────────────────── */
const SORTS = {
  nuevo: (a, b) => b.new.localeCompare(a.new),
  precio_asc: (a, b) => a.p - b.p,
  precio_desc: (a, b) => b.p - a.p,
  nombre: (a, b) => a.t.localeCompare(b.t, 'es'),
};

function viewCollection(slug, q) {
  const n = NAVBY[slug];
  if (!n) return view404();

  const base = productsOf(slug);
  const types = [...new Set(base.map(p => p.ty))]
    .map(t => [t, base.filter(p => p.ty === t).length])
    .sort((a, b) => b[1] - a[1]).slice(0, 14);
  const gens = GENDER.filter(g => base.some(p => gendersOf(p).includes(g.key)));

  const fT = q.get('t') || '';
  const fG = q.get('g') || '';
  const fD = q.get('d') === '1';
  const sort = q.get('s') || 'nuevo';
  const shown = +(q.get('n') || 24);

  let list = base
    .filter(p => (!fT || p.ty === fT))
    .filter(p => (!fG || gendersOf(p).includes(fG)))
    .filter(p => (!fD || p.av))
    .sort(SORTS[sort] || SORTS.nuevo);

  const total = list.length;
  const page = list.slice(0, shown);
  const active = fT || fG || fD;

  const qs = (over) => {
    const u = new URLSearchParams(q);
    Object.entries(over).forEach(([k, v]) => v === null || v === '' ? u.delete(k) : u.set(k, v));
    u.delete('n');
    const s = u.toString();
    return `/c/${slug}${s ? '?' + s : ''}`;
  };

  return `
  <section class="dark chead">
    <div class="wrap">
      <nav class="crumbs" aria-label="Migas"><a href="/" data-link>Inicio</a><span>/</span>${esc(n.label)}</nav>
      <h1 class="display display--sm">${esc(n.label)}</h1>
      <p class="lede" style="margin-top:.9rem">${base.length} referencias disponibles en esta disciplina.</p>
    </div>
  </section>

  <div class="light">
    <div class="wrap">
      <div class="toolbar">
        <p class="toolbar__count">${total} producto${total === 1 ? '' : 's'}</p>
        <div class="chips">
          ${gens.map(g => `<a class="chip ${fG === g.key ? 'is-on' : ''}" href="${qs({ g: fG === g.key ? null : g.key })}" data-link>${g.label}</a>`).join('')}
          <a class="chip ${fD ? 'is-on' : ''}" href="${qs({ d: fD ? null : '1' })}" data-link>En stock</a>
          ${active ? `<a class="chip chip--clear" href="/c/${slug}" data-link>Limpiar</a>` : ''}
        </div>
        <label class="sr-only" for="sort">Ordenar</label>
        <select class="sel" id="sort" data-slug="${slug}">
          ${[['nuevo', 'Novedades'], ['precio_asc', 'Precio ↑'], ['precio_desc', 'Precio ↓'], ['nombre', 'A–Z']]
            .map(([v, l]) => `<option value="${v}" ${sort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>

      ${types.length > 1 ? `<div class="chips" style="padding:1.2rem 0 0">
        <a class="chip ${!fT ? 'is-on' : ''}" href="${qs({ t: null })}" data-link>Todo</a>
        ${types.map(([t, c]) => `<a class="chip ${fT === t ? 'is-on' : ''}" href="${qs({ t })}" data-link>${esc(t)} (${c})</a>`).join('')}
      </div>` : ''}
    </div>
  </div>

  <section class="sec--tight light">
    <div class="wrap">
      ${total
        ? gridOf(page, 8) + (total > shown
          ? `<div class="more"><a class="btn btn--ghost" href="${(() => { const u = new URLSearchParams(q); u.set('n', shown + 24); return `/c/${slug}?${u}`; })()}" data-link>Cargar más (${total - shown})</a></div>`
          : '')
        : `<div class="empty"><h2 class="display display--sm">Sin resultados</h2>
             <p>Probá quitando algún filtro.</p>
             <a class="btn btn--ghost" href="/c/${slug}" data-link>Limpiar filtros</a></div>`}
    </div>
  </section>`;
}

/* ── Vista: Producto ──────────────────────────────────────── */
function viewProduct(handle) {
  const p = S.byHandle.get(handle);
  if (!p) return view404();

  const sale = p.cmp > p.p;
  const price = sale
    ? `<span class="now">${money(p.p)}</span> <s>${money(p.cmp)}</s>`
    : money(p.p) + (p.pmax > p.p ? ` <s style="text-decoration:none">– ${money(p.pmax)}</s>` : '');

  const parent = NAV.find(n => n.cols && p.c.some(h => n.cols.includes(h)));

  // Similares: mismo tipo y, si no alcanza, resto de la disciplina.
  let rel = S.products.filter(x => x.ty === p.ty && x.h !== p.h && x.av).slice(0, 5);
  if (rel.length < 5 && parent) {
    const set = new Set(parent.cols);
    const seen = new Set(rel.map(x => x.h).concat(p.h));
    rel = rel.concat(
      S.products.filter(x => x.av && !seen.has(x.h) && x.c.some(h => set.has(h))).slice(0, 5 - rel.length)
    );
  }

  const desc = p.d || 'Prenda técnica V-ONE-B en textil importado de alto desempeño, con secado rápido y protección contra rayos UV.';

  return `
  <div class="light sec--tight">
    <div class="wrap">
      <nav class="crumbs" style="color:var(--ink-40)" aria-label="Migas">
        <a href="/" data-link>Inicio</a><span>/</span>
        ${parent ? `<a href="/c/${parent.slug}" data-link>${esc(parent.label)}</a><span>/</span>` : ''}
        ${esc(p.ty)}
      </nav>

      <div class="pdp" style="margin-top:1.4rem">
        <div class="gal">
          ${p.img.map((_, i) => `<figure>${pic(p, i, 1200, '', i === 0)}</figure>`).join('')}
        </div>

        <div class="pinfo">
          <p class="eyebrow" style="color:var(--red-ui)">${esc(p.ty)}</p>
          <h1>${esc(p.t)}</h1>
          <p class="pinfo__price">${price}</p>
          <p class="pinfo__tax">IVA incluido. Envío calculado al finalizar la compra.</p>
          <p class="pinfo__desc">${esc(desc)}</p>

          ${hasOptions(p) ? `<div class="sizes">
            <div class="sizes__hd">
              <p class="eyebrow">${vLabel(p)}</p>
              ${vLabel(p) === 'Talla' ? `<button class="link-u js-guide" style="border:0;font-size:.66rem;color:var(--ink-60)">Guía de tallas</button>` : ''}
            </div>
            <div class="sizes__grid" id="sizes">
              ${p.v.map((v, i) => `<button class="size ${p.v.length === 1 ? 'is-on' : ''}" data-i="${i}" ${v.a ? '' : 'disabled'}>${esc(v.t)}</button>`).join('')}
            </div>
          </div>` : '<div style="height:1.6rem"></div>'}

          <button class="btn btn--red btn--block js-add" data-h="${p.h}" ${p.av ? '' : 'disabled'}>
            ${p.av ? 'Agregar al carrito' : 'Agotado'}
          </button>

          <div class="acc" style="margin-top:2.2rem">
            ${[
              ['Materiales y cuidado', `<ul>
                <li>Textil importado de alto desempeño, secado rápido.</li>
                <li>Protección contra rayos UV.</li>
                <li>Lavar a máquina en frío, no usar secadora ni blanqueador.</li>
                <li>No planchar sobre estampados ni reflectivos.</li></ul>`],
              ['Envíos', `<p>Correos de Costa Rica (2–4 días hábiles) o mensajería privada GAM (24–48 h).
                 Envío gratis en compras superiores a ₡ 50.000.</p>`],
              ['Cambios y servicio post venta', `<p>30 días para cambio de talla con la etiqueta puesta.
                 Además realizamos ajustes y cambio de piezas sobre prendas ya usadas.</p>`],
            ].map(([t, body], i) => `
              <div class="acc__i">
                <button class="acc__b js-acc" aria-expanded="${i === 0}" aria-controls="acc-${i}">${t}<span>+</span></button>
                <div class="acc__p ${i === 0 ? 'is-open' : ''}" id="acc-${i}">${body}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>

  ${rel.length ? `<section class="sec--tight snow">
    <div class="wrap">
      <div class="sec__hd"><div><p class="eyebrow">Seguí viendo</p><h2 class="display display--sm">Similares</h2></div></div>
      ${gridOf(rel, 0)}
    </div>
  </section>` : ''}`;
}

/* ── Vista: Personalización ───────────────────────────────── */
function viewPersonalizacion() {
  const servicios = [
    ['Uniformes de equipo', 'Kits completos para clubes, escuelas y empresas, en los colores y con el escudo de tu equipo.',
     '<path d="M8.5 3.5L12 6l3.5-2.5 4.5 2.2-2 5-2 .6V20.5H8V11.3l-2-.6-2-5z"/>'],
    ['Nombre y dorsal', 'Numeración y nombre por prenda, para que cada integrante reciba la suya identificada.',
     '<path d="M4 5h16v14H4z"/><path d="M8.5 15V9l3 4.5V9M14 9h2.5M14 15h2.5M14 9v6M14 12h2"/>'],
    ['Ajuste de patrón', 'Modificamos largos, tiro y calce sobre nuestros moldes cuando la talla estándar no calza.',
     '<path d="M6 3v13a3 3 0 1 0 3 3M18 3v13a3 3 0 1 1-3 3"/><path d="M6 8h12"/>'],
    ['Cambio de piezas', 'Sustituimos badana, cierres, elásticos o paneles de prendas que ya tenés en uso.',
     '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>'],
  ];

  const pasos = [
    ['Contanos qué necesitás', 'Disciplina, cantidad aproximada, prendas y fecha en la que lo ocupás.'],
    ['Propuesta y boceto', 'Te devolvemos el diseño aplicado sobre nuestros moldes, con precio y tiempo de entrega.'],
    ['Muestra física', 'Producimos una unidad para revisar calce, color y estampado antes de correr todo el lote.'],
    ['Producción y entrega', 'Confeccionamos en nuestro taller en San José y lo enviamos a todo el país.'],
  ];

  return `
  <section class="dark chead">
    <div class="wrap">
      <nav class="crumbs" aria-label="Migas"><a href="/" data-link>Inicio</a><span>/</span>Personalización</nav>
      <h1 class="display display--sm">Tu equipo,<br>tu equipación</h1>
      <p class="lede" style="margin-top:1.1rem">Fabricamos en Costa Rica, así que podemos producir con tus colores,
        tu escudo y tus medidas. Desde una prenda ajustada a tu calce hasta el kit completo de un club.</p>
      <div class="ctas">
        <a class="btn btn--red" href="/contacto" data-link>Pedir una cotización</a>
      </div>
    </div>
  </section>

  <section class="sec--tight light rv">
    <div class="wrap">
      <div class="sec__hd"><div><p class="eyebrow">Qué hacemos</p><h2 class="display display--sm">Servicios</h2></div></div>
      <div class="feats">
        ${servicios.map(([h, p, ic]) => `<div class="feat">
          <svg class="feat__ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>
          <h3>${h}</h3><p>${p}</p></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="sec--tight snow rv">
    <div class="wrap">
      <div class="sec__hd"><div><p class="eyebrow">Cómo funciona</p><h2 class="display display--sm">El proceso</h2></div></div>
      <ol class="pasos">
        ${pasos.map(([t, d], i) => `<li class="paso">
          <span class="paso__n">${String(i + 1).padStart(2, '0')}</span>
          <h3>${t}</h3><p>${d}</p></li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="sec dark rv">
    <div class="wrap manifesto">
      <p class="eyebrow eyebrow--red">Empecemos</p>
      <h2 class="display display--sm">Contanos qué<br>tenés en mente</h2>
      <p class="lede manifesto__sub">Cantidades mínimas, tiempos y precios dependen de la prenda:
        escribinos y te pasamos la propuesta.</p>
      <div class="ctas" style="justify-content:center">
        <a class="btn btn--red" href="/contacto" data-link>Contacto</a>
        <a class="btn btn--ghost-d" href="https://wa.me/50600000000" target="_blank" rel="noopener noreferrer nofollow">WhatsApp</a>
      </div>
    </div>
  </section>`;
}

/* ── Vistas simples ───────────────────────────────────────── */
const PAGES = {
  contacto: ['Contacto', `<p>Escribinos y te respondemos el mismo día hábil.</p>
    <h2>WhatsApp</h2><p>+506 0000 0000 · lunes a viernes, 8 a.m. – 5 p.m.</p>
    <h2>Correo</h2><p>hola@v-one-b.com</p>
    <h2>Taller</h2><p>San José, Costa Rica. Visitas con cita previa.</p>`],
  envios: ['Envíos', `<p>Enviamos a todo Costa Rica.</p>
    <h2>Correos de Costa Rica</h2><p>2 a 4 días hábiles a todo el país.</p>
    <h2>Mensajería privada</h2><p>24 a 48 horas dentro del Gran Área Metropolitana.</p>
    <h2>Envío gratis</h2><p>En compras superiores a ₡ 50.000.</p>`],
  politicas: ['Políticas', `<h2>Cambios</h2><p>30 días naturales para cambio de talla, con etiqueta puesta y sin uso.</p>
    <h2>Servicio post venta</h2><p>Realizamos ajustes y cambio de piezas sobre prendas ya usadas.</p>
    <h2>Privacidad</h2><p>Usamos tus datos únicamente para procesar pedidos y enviarte información que solicitaste.</p>`],
  cuenta: ['Mi cuenta', `<p>Prototipo de rediseño: el acceso a la cuenta se conecta al sistema de clientes de la tienda.</p>`],
};

function viewPage(key) {
  const [t, body] = PAGES[key];
  return `<section class="dark chead"><div class="wrap">
      <nav class="crumbs"><a href="/" data-link>Inicio</a><span>/</span>${t}</nav>
      <h1 class="display display--sm">${t}</h1>
    </div></section>
    <section class="sec--tight light"><div class="wrap"><div class="prose">${body}</div></div></section>`;
}

const view404 = () => `<section class="sec light"><div class="wrap empty">
  <p class="eyebrow eyebrow--red">Error 404</p>
  <h1 class="display display--sm" style="margin-top:.8rem">Esta página no existe</h1>
  <p>Puede que el producto ya no esté disponible.</p>
  <a class="btn btn--red" href="/" data-link>Volver al inicio</a>
</div></section>`;

/* ── Router ───────────────────────────────────────────────── */
let lastKey = '';

async function render() {
  await S.ready;
  const { pathname, searchParams } = new URL(location.href);
  const seg = pathname.split('/').filter(Boolean);
  const main = $('#main');

  let html, title = 'V-ONE-B — Ropa deportiva técnica hecha en Costa Rica';
  if (!seg.length) html = viewHome();
  else if (seg[0] === 'c') { html = viewCollection(seg[1], searchParams); title = `${NAVBY[seg[1]]?.label || 'Colección'} — V-ONE-B`; }
  else if (seg[0] === 'p') { html = viewProduct(seg[1]); title = `${S.byHandle.get(seg[1])?.t || 'Producto'} — V-ONE-B`; }
  else if (seg[0] === 'personalizacion') { html = viewPersonalizacion(); title = 'Personalización — V-ONE-B'; }
  else if (PAGES[seg[0]]) { html = viewPage(seg[0]); title = `${PAGES[seg[0]][0]} — V-ONE-B`; }
  else html = view404();

  document.title = title;
  main.innerHTML = html;
  // Se lee de location, no de searchParams: re-serializar cambia la codificación
  // y el guardia de popstate compara contra location.search en crudo.
  lastKey = location.pathname + location.search;

  const aqui = seg[0] === 'c' ? `/c/${seg[1]}` : `/${seg[0] || ''}`;
  $$('.nav__link').forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === aqui));
  observe();
  bindView();
}

function go(href, replace = false) {
  history[replace ? 'replaceState' : 'pushState']({}, '', href);
  render().then(() => {
    if (!href.includes('?n=')) window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  e.preventDefault();
  closeAll();
  go(a.getAttribute('href'));
});
// Un salto a un ancla (#main, #cats) también dispara popstate. Sin este guardia
// el router re-renderiza #main, destruye el elemento de destino y el salto se pierde.
window.addEventListener('popstate', () => {
  if (location.pathname + location.search === lastKey) return; // sólo cambió el hash
  render();
});

/* ── Interacciones por vista ──────────────────────────────── */
function bindView() {
  $('#sort')?.addEventListener('change', e => {
    const u = new URL(location.href);
    u.searchParams.set('s', e.target.value);
    u.searchParams.delete('n');
    go(u.pathname + u.search);
  });

  let picked = null;
  $$('#sizes .size').forEach(b => b.addEventListener('click', () => {
    $$('#sizes .size').forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on');
    picked = +b.dataset.i;
  }));

  $$('.js-acc').forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!open));
    $('#' + b.getAttribute('aria-controls')).classList.toggle('is-open', !open);
  }));

  $('.js-guide')?.addEventListener('click', () => toast('Guía de tallas: pendiente de contenido'));

  // El salto nativo al fragmento no sobrevive junto al router de History API.
  // Se conserva el href por accesibilidad y sin JS, pero el scroll se hace aquí.
  $('.hero__scroll')?.addEventListener('click', e => {
    e.preventDefault();
    // Sin `behavior`: hereda el scroll-behavior del CSS, que ya respeta
    // prefers-reduced-motion. Pasarlo explícito aquí resultaba inestable.
    $('#cats')?.scrollIntoView();
  });

  $('.js-add')?.addEventListener('click', e => {
    const p = S.byHandle.get(e.currentTarget.dataset.h);
    const multi = p.v.length > 1;
    if (multi && picked === null) { toast('Elegí una talla'); $('#sizes')?.scrollIntoView({ block: 'center' }); return; }
    add(p, p.v[picked ?? 0]);
  });

  $$('.js-quick').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const p = S.byHandle.get(b.dataset.h);
    if (p.v.length > 1) return go(`/p/${p.h}`);
    add(p, p.v[0]);
  }));
}

/* ── Carrito ──────────────────────────────────────────────── */
function add(p, v) {
  const key = p.h + '|' + v.t;
  const hit = cart.find(i => i.k === key);
  if (hit) hit.q++;
  else cart.push({ k: key, h: p.h, t: p.t, v: v.t, p: v.p, img: p.img[0], q: 1 });
  save(CART_KEY, cart);
  paintCart();
  openCart();
  toast('Agregado al carrito');
}

function paintCart() {
  const n = cart.reduce((s, i) => s + i.q, 0);
  const dot = $('#cartdot');
  dot.textContent = n; dot.hidden = !n;

  const body = $('#cart-body');
  if (!cart.length) {
    body.innerHTML = `<div class="empty" style="padding-block:3rem">
      <p class="eyebrow" style="color:var(--ink-40)">Carrito vacío</p>
      <p>Todavía no agregaste nada.</p>
      <a class="btn btn--ghost" href="/c/ciclismo" data-link>Ver productos</a></div>`;
    $('#cart-foot').hidden = true;
    return;
  }
  body.innerHTML = cart.map(i => `<div class="ci" data-k="${esc(i.k)}">
      <a href="/p/${i.h}" data-link><img src="${imgW(i.img, 200)}" alt="${esc(i.t)}"></a>
      <div>
        <a href="/p/${i.h}" data-link><p class="ci__t">${esc(i.t)}</p></a>
        ${DEFAULT_V.test(i.v) ? '' : `<p class="ci__v">${esc(i.v)}</p>`}
        <div class="ci__qty">
          <button data-d="-1" aria-label="Quitar uno">−</button>
          <span>${i.q}</span>
          <button data-d="1" aria-label="Agregar uno">+</button>
        </div>
      </div>
      <div><p class="ci__p">${money(i.p * i.q)}</p><button class="ci__rm" data-rm>Quitar</button></div>
    </div>`).join('');
  $('#cart-total').textContent = money(cart.reduce((s, i) => s + i.p * i.q, 0));
  $('#cart-foot').hidden = false;
}

$('#cart-body').addEventListener('click', e => {
  const row = e.target.closest('.ci'); if (!row) return;
  const it = cart.find(i => i.k === row.dataset.k); if (!it) return;
  if (e.target.dataset.rm !== undefined) cart = cart.filter(i => i !== it);
  else if (e.target.dataset.d) {
    it.q += +e.target.dataset.d;
    if (it.q < 1) cart = cart.filter(i => i !== it);
  } else return;
  save(CART_KEY, cart); paintCart();
});

$('#cart-checkout').addEventListener('click', () => toast('Checkout: se conecta a la pasarela de la tienda'));

/* ── Overlays ─────────────────────────────────────────────── */
const scrim = $('#scrim'), drawer = $('#cart'), search = $('#search');

function openCart() {
  scrim.hidden = false; drawer.hidden = false;
  requestAnimationFrame(() => { scrim.classList.add('is-on'); drawer.classList.add('is-on'); });
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  $('#cart-close').focus();
}
function openSearch() {
  search.hidden = false;
  requestAnimationFrame(() => search.classList.add('is-on'));
  search.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  $('#search-input').focus();
}
function closeAll() {
  scrim.classList.remove('is-on'); drawer.classList.remove('is-on'); search.classList.remove('is-on');
  drawer.setAttribute('aria-hidden', 'true'); search.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  $('#nav').classList.remove('is-on');
  $('#burger').setAttribute('aria-expanded', 'false');
  setTimeout(() => { scrim.hidden = true; drawer.hidden = true; search.hidden = true; }, 380);
}

$('#btn-cart').addEventListener('click', openCart);
$('#cart-close').addEventListener('click', closeAll);
$('#scrim').addEventListener('click', closeAll);
$('#btn-search').addEventListener('click', openSearch);
$('#search-close').addEventListener('click', closeAll);
search.addEventListener('click', e => { if (e.target === search) closeAll(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAll();
  if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
});

$('#burger').addEventListener('click', e => {
  const on = $('#nav').classList.toggle('is-on');
  e.currentTarget.setAttribute('aria-expanded', String(on));
  document.body.classList.toggle('is-locked', on);
});

/* ── Búsqueda ─────────────────────────────────────────────── */
let stimer;
$('#search-input').addEventListener('input', e => {
  clearTimeout(stimer);
  stimer = setTimeout(() => runSearch(e.target.value), 130);
});

function runSearch(raw) {
  const box = $('#search-res');
  const q = norm(raw.trim());
  if (q.length < 2) {
    box.innerHTML = `<p class="search__hint">Escribí al menos 2 letras. Probá con “jersey”, “licra”, “medias”.</p>`;
    return;
  }
  const words = q.split(/\s+/);
  const hits = S.products.map(p => {
    const hay = norm(`${p.t} ${p.ty} ${p.tg.join(' ')}`);
    let sc = 0;
    for (const w of words) {
      if (!hay.includes(w)) return null;
      if (norm(p.t).startsWith(w)) sc += 4;
      else if (norm(p.t).includes(w)) sc += 3;
      else if (norm(p.ty).includes(w)) sc += 2;
      else sc += 1;
    }
    return { p, sc: sc + (p.av ? .5 : 0) };
  }).filter(Boolean).sort((a, b) => b.sc - a.sc);

  if (!hits.length) {
    box.innerHTML = `<p class="search__hint">Sin resultados para “${esc(raw)}”.</p>`;
    return;
  }
  box.innerHTML =
    `<p class="search__hint" style="margin-bottom:.8rem">${hits.length} resultado${hits.length === 1 ? '' : 's'}</p>` +
    hits.slice(0, 30).map(({ p }) => `<a class="sres" href="/p/${p.h}" data-link>
      <img src="${imgW(p.img[0], 160)}" alt="" loading="lazy">
      <div><p class="sres__t">${esc(p.t)}</p><p class="sres__ty">${esc(p.ty)}</p></div>
      <p class="sres__p">${p.av ? money(p.p) : 'Agotado'}</p></a>`).join('');
}

/* ── Newsletter ───────────────────────────────────────────── */
$('#news-form').addEventListener('submit', e => {
  e.preventDefault();
  $('#news-msg').textContent = '¡Listo! Revisá tu correo para confirmar.';
  e.target.reset();
});

/* ── Toast ────────────────────────────────────────────────── */
let ttimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(ttimer);
  ttimer = setTimeout(() => t.classList.remove('is-on'), 2600);
}

/* ── Reveal al hacer scroll ───────────────────────────────── */
let io;
function observe() {
  io?.disconnect();
  io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));
}

/* ── Chrome (nav, flyout, footer, ticker) ─────────────────── */
function paintChrome() {
  $('#nav').innerHTML = NAV.map(n => `<div class="nav__item" data-slug="${n.slug}">
      <a class="nav__link${n.page ? ' nav__link--svc' : ''}" href="${n.href || `/c/${n.slug}`}" data-link
         ${n.red ? 'style="color:var(--red)"' : ''}>${esc(n.label)}</a>
    </div>`).join('');

  // Flyout con los tipos reales de cada disciplina (no enlaces muertos).
  const flyout = $('#flyout');
  let hoverTimer;
  $$('.nav__item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      if (window.innerWidth < 1240) return;
      clearTimeout(hoverTimer);
      const n = NAVBY[item.dataset.slug];
      const base = productsOf(n.slug);
      // Los ítems de servicio no tienen producto: se cierra el panel en vez de
      // dejar visible el contenido de la disciplina anterior.
      if (!base.length) { flyout.hidden = true; return; }
      const types = [...new Set(base.map(p => p.ty))]
        .map(t => [t, base.filter(p => p.ty === t).length])
        .sort((a, b) => b[1] - a[1]).slice(0, 12);
      const gens = GENDER.filter(g => base.some(p => gendersOf(p).includes(g.key)));
      const col = (title, links) => `<div class="flyout__grp"><h4 class="eyebrow">${title}</h4>${links}</div>`;
      const half = Math.ceil(types.length / 2);
      flyout.innerHTML = `<div class="flyout__in">
        ${col('Categoría', types.slice(0, half).map(([t, c]) => `<a href="/c/${n.slug}?t=${encodeURIComponent(t)}" data-link>${esc(t)}<span>${c}</span></a>`).join(''))}
        ${types.length > half ? col('&nbsp;', types.slice(half).map(([t, c]) => `<a href="/c/${n.slug}?t=${encodeURIComponent(t)}" data-link>${esc(t)}<span>${c}</span></a>`).join('')) : ''}
        ${gens.length ? col('Para', gens.map(g => `<a href="/c/${n.slug}?g=${g.key}" data-link>${g.label}</a>`).join('') +
          `<a href="/c/${n.slug}" data-link>Ver todo <span>${base.length}</span></a>`) : ''}
        <a class="flyout__promo" href="/c/${n.slug}" data-link>
          <img src="/assets/brand/${n.img}" alt="">
          <div><p class="eyebrow" style="color:var(--red);margin-bottom:.5rem">Colección 2026</p><p>${esc(n.label)}</p></div>
        </a>
      </div>`;
      flyout.hidden = false;
    });
  });
  $('#hdr').addEventListener('mouseleave', () => { hoverTimer = setTimeout(() => flyout.hidden = true, 120); });
  $('#hdr').addEventListener('mouseenter', () => clearTimeout(hoverTimer));
  flyout.addEventListener('click', () => flyout.hidden = true);

  $('#ftr-cols').innerHTML = [
    ['Disciplinas', NAV.slice(0, 5).map(n => [n.label, `/c/${n.slug}`])],
    ['Tienda', [['Lifestyle', '/c/lifestyle'], ['Accesorios', '/c/accesorios'], ['Costa Rica', '/c/costa-rica'], ['Outlet', '/c/outlet'], ['Personalización', '/personalizacion']]],
    ['Ayuda', [['Contacto', '/contacto'], ['Envíos', '/envios'], ['Políticas', '/politicas'], ['Mi cuenta', '/cuenta']]],
  ].map(([t, items]) => `<div><h4 class="eyebrow">${t}</h4>
      ${items.map(([l, h]) => `<a href="${h}" data-link>${l}</a>`).join('')}</div>`).join('');

  const msgs = ['Envío gratis en compras superiores a <b>₡ 50.000</b>',
    'Protección UV + secado rápido', 'Confeccionado en Costa Rica',
    'Servicio post venta: ajustes y cambio de piezas'];
  $('.ticker__track').innerHTML = [...msgs, ...msgs].map(m => `<span>${m}</span>`).join('');

  $('#yr').textContent = new Date().getFullYear();
}

/* ── Arranque ─────────────────────────────────────────────── */
S.ready = fetch('/data/catalog.json')
  .then(r => r.json())
  .then(d => {
    S.products = d.products;
    S.collections = d.collections;
    d.products.forEach(p => S.byHandle.set(p.h, p));
    paintChrome();
    paintCart();
  })
  .catch(() => {
    $('#main').innerHTML = `<section class="sec light"><div class="wrap empty">
      <h1 class="display display--sm">No se pudo cargar el catálogo</h1>
      <p>Verificá que el servidor esté corriendo en el puerto 3000.</p></div></section>`;
  });

render();

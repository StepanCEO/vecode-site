// Построители JSON-LD (schema.org). Все сущности связаны стабильными @id.
import { SITE, abs } from './config.mjs';

export const ID = {
  org: abs('/#organization'),
  website: abs('/#website'),
  logo: abs('/#logo'),
  page: (path) => abs(`${path}#webpage`),
  breadcrumb: (path) => abs(`${path}#breadcrumb`),
  faq: (path) => abs(`${path}#faq`),
  service: (path) => abs(`${path}#service`),
  image: (path) => abs(`${path}#primaryimage`),
};

/** Убирает пустые значения: null, undefined, '', [] — чтобы в разметку не попадали «дыры» */
export function compact(obj) {
  if (Array.isArray(obj)) return obj.map(compact).filter((v) => v !== undefined);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const c = compact(v);
      if (c === undefined || c === null || c === '' || (Array.isArray(c) && !c.length)) continue;
      if (typeof c === 'object' && !Array.isArray(c) && !Object.keys(c).length) continue;
      out[k] = c;
    }
    return out;
  }
  return obj;
}

const areaServed = () => SITE.areaServed.map((name) => ({ '@type': 'Country', name }));

export function buildOrganization({ services = [] } = {}) {
  return {
    '@type': 'Organization',
    '@id': ID.org,
    name: SITE.name,
    alternateName: SITE.alternateNames,
    legalName: SITE.legalName,
    url: abs('/'),
    description: SITE.description,
    slogan: SITE.tagline,
    logo: {
      '@type': 'ImageObject',
      '@id': ID.logo,
      url: abs(SITE.logo.path),
      contentUrl: abs(SITE.logo.path),
      width: SITE.logo.width,
      height: SITE.logo.height,
      caption: SITE.name,
    },
    image: { '@id': ID.logo },
    email: SITE.email,
    telephone: SITE.phone,
    address: SITE.address,
    areaServed: areaServed(),
    knowsAbout: services.map((s) => s.serviceType),
    knowsLanguage: 'ru',
    contactPoint: SITE.email || SITE.phone
      ? [{ '@type': 'ContactPoint', contactType: 'sales', email: SITE.email, telephone: SITE.phone, availableLanguage: ['Russian'], areaServed: SITE.areaServed }]
      : null,
    sameAs: SITE.sameAs,
  };
}

export function buildWebSite() {
  // SearchAction не добавляем: поиска на сайте нет
  return {
    '@type': 'WebSite',
    '@id': ID.website,
    url: abs('/'),
    name: SITE.name,
    alternateName: SITE.alternateNames,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { '@id': ID.org },
  };
}

export function buildWebPage({ path, title, description, type = 'WebPage', updated = SITE.updated, about, breadcrumb = true, mainEntity }) {
  return {
    '@type': type,
    '@id': ID.page(path),
    url: abs(path),
    name: title,
    description,
    inLanguage: SITE.language,
    isPartOf: { '@id': ID.website },
    about: about ? { '@id': about } : { '@id': ID.org },
    publisher: { '@id': ID.org },
    primaryImageOfPage: { '@id': ID.image(path) },
    image: { '@id': ID.image(path) },
    dateModified: updated,
    breadcrumb: breadcrumb ? { '@id': ID.breadcrumb(path) } : null,
    mainEntity: mainEntity ? { '@id': mainEntity } : null,
  };
}

export function buildPrimaryImage(path) {
  return {
    '@type': 'ImageObject',
    '@id': ID.image(path),
    url: abs(SITE.ogImage.path),
    contentUrl: abs(SITE.ogImage.path),
    width: SITE.ogImage.width,
    height: SITE.ogImage.height,
    caption: SITE.ogImage.alt,
  };
}

/** items: [{ name, path }] — последняя крошка = текущая страница */
export function buildBreadcrumbs(path, items) {
  return {
    '@type': 'BreadcrumbList',
    '@id': ID.breadcrumb(path),
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function buildService(service, path) {
  // Offer не добавляем: цен нет (решение владельца). TODO: offers с priceSpecification, когда появятся цены «от».
  return {
    '@type': 'Service',
    '@id': ID.service(path),
    name: service.name,
    serviceType: service.serviceType,
    description: service.answer,
    url: abs(path),
    provider: { '@id': ID.org },
    brand: { '@id': ID.org },
    areaServed: areaServed(),
    availableChannel: { '@type': 'ServiceChannel', serviceUrl: abs('/#contact'), availableLanguage: 'ru' },
    mainEntityOfPage: { '@id': ID.page(path) },
  };
}

export function buildFaqPage(path, faq) {
  return {
    '@type': 'FAQPage',
    '@id': ID.faq(path),
    isPartOf: { '@id': ID.page(path) },
    inLanguage: SITE.language,
    mainEntity: faq.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function buildItemList(path, services, servicePath) {
  return {
    '@type': 'ItemList',
    '@id': abs(`${path}#services`),
    name: 'Услуги студии Vecode',
    numberOfItems: services.length,
    itemListElement: services.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(servicePath(s)),
      name: s.name,
    })),
  };
}

export function graph(nodes) {
  return compact({ '@context': 'https://schema.org', '@graph': nodes });
}

/** Безопасная сериализация для <script type="application/ld+json"> */
export function jsonLdScript(data) {
  const json = JSON.stringify(data, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

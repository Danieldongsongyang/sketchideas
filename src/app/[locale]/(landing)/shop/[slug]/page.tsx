import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Download, ShieldCheck, Star } from 'lucide-react';

import { envConfigs } from '@/config';
import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';

type ShopItem = {
  slug?: string;
  title?: string;
  description?: string;
  long_description?: string;
  url?: string;
  target?: string;
  image?: {
    src?: string;
    alt?: string;
  };
  group?: string;
  price?: string;
  rating?: string;
  reviews?: string;
  seller_name?: string;
  seller_handle?: string;
  seller_avatar?: string;
  badge?: string;
  includes?: string[];
  gallery?: string[];
  highlights?: string[];
  creator_bio?: string;
  delivery?: string;
};

type ShopSection = {
  items?: ShopItem[];
};

type DetailText = {
  back?: string;
  buy_now?: string;
  includes_title?: string;
  highlights_title?: string;
  about_creator_title?: string;
  delivery_title?: string;
  related_title?: string;
  rating_label?: string;
};

async function getShopData(locale: string) {
  const t = await getTranslations({ locale, namespace: 'pages.shop' });
  const section = t.raw('page.sections.shop') as ShopSection;
  const detail = t.raw('page.detail') as DetailText;
  return { section, detail };
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const { section } = await getShopData(locale);
  const product = (section.items || []).find((item) => item.slug === slug);

  const canonicalPath = `/shop/${slug}`;
  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}${canonicalPath}`
      : `${envConfigs.app_url}${canonicalPath}`;

  if (!product) {
    return {
      title: 'Product Not Found | Shop',
      description: 'This sketch product could not be found.',
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: `${product.title} | Shop`,
    description: product.description || 'Sketch resource product detail page.',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { section, detail } = await getShopData(locale);

  const product = (section.items || []).find((item) => item.slug === slug);
  if (!product) {
    notFound();
  }

  const relatedItems = (section.items || [])
    .filter((item) => item.slug !== product.slug && item.group === product.group)
    .slice(0, 3);

  const buyHref = product.url || '#';
  const buyTarget = product.target || '_self';
  const buyRel = buyTarget === '_blank' ? 'noopener noreferrer' : undefined;
  const galleryImages =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image?.src || '/imgs/cases/1.png'];

  return (
    <section className="bg-[#f7f8fb] py-10 md:py-14">
      <div className="container max-w-7xl space-y-6">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="size-4" />
          {detail.back || 'Back to Shop'}
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-4 md:p-6">
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={product.image?.src || '/imgs/cases/1.png'}
                  alt={product.image?.alt || product.title || 'product cover'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="object-cover object-center"
                />
              </div>
              {product.badge && (
                <span className="absolute top-4 left-4 rounded-full border border-black/20 bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-800">
                  {product.badge}
                </span>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {galleryImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
                  >
                    <Image
                      src={src}
                      alt={`${product.title || 'product'} preview ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 40vw, 18vw"
                      className="object-cover object-center"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <h1 className="text-3xl leading-tight font-semibold text-zinc-900 md:text-4xl">
                {product.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                {product.long_description || product.description}
              </p>
            </div>

            {product.includes && product.includes.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:p-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {detail.includes_title || "What's Included"}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700 md:text-base">
                  {product.includes.map((entry) => (
                    <li key={entry} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-zinc-900" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.highlights && product.highlights.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 md:p-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {detail.highlights_title || 'Highlights'}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700 md:text-base">
                  {product.highlights.map((entry) => (
                    <li key={entry} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 rounded-full bg-zinc-900" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h3 className="text-base font-semibold text-zinc-900">
                  {detail.about_creator_title || 'About the Creator'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 md:text-base">
                  {product.creator_bio ||
                    `${product.seller_name || 'Sketch Ideas'} creates practical resources for daily drawing practice.`}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <h3 className="text-base font-semibold text-zinc-900">
                  {detail.delivery_title || 'Delivery & License'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 md:text-base">
                  {product.delivery ||
                    'Instant digital delivery after payment. Personal use license included.'}
                </p>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-zinc-900 bg-white p-5 shadow-[0_16px_36px_rgba(0,0,0,0.12)] lg:sticky lg:top-24">
            <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
              Digital Product
            </p>
            <h2 className="mt-2 text-xl leading-tight font-semibold text-zinc-900">
              {product.title}
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative size-10 overflow-hidden rounded-full border border-zinc-300">
                <Image
                  src={product.seller_avatar || '/imgs/avatars/1.png'}
                  alt={product.seller_name || 'seller'}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm leading-none font-semibold text-zinc-900">
                  {product.seller_name || 'Sketch Ideas'}
                </p>
                {product.seller_handle && (
                  <p className="mt-1 text-xs text-zinc-500">{product.seller_handle}</p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Price</p>
              <p className="mt-1 text-3xl font-semibold text-zinc-900">
                {product.price || '$0.00'}
              </p>
              {(product.rating || product.reviews) && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <Star className="size-4 fill-current" />
                  {detail.rating_label || 'Rating'}: {product.rating || '-'}
                  {product.reviews ? ` (${product.reviews})` : ''}
                </p>
              )}
            </div>

            <Button asChild className="mt-5 h-11 w-full rounded-full bg-zinc-900 text-white hover:bg-zinc-700">
              <a href={buyHref} target={buyTarget} rel={buyRel}>
                {detail.buy_now || 'Buy This Pack'}
              </a>
            </Button>

            <div className="mt-5 space-y-2 text-sm text-zinc-600">
              <p className="inline-flex items-center gap-2">
                <Download className="size-4" />
                Instant download after checkout
              </p>
              <p className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4" />
                Secure payment and license confirmation
              </p>
            </div>
          </aside>
        </div>

        {relatedItems.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-6">
            <h2 className="text-2xl font-semibold text-zinc-900">
              {detail.related_title || 'You May Also Like'}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {relatedItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/shop/${item.slug}`}
                  className="group overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 transition-colors hover:border-zinc-900"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={item.image?.src || '/imgs/cases/1.png'}
                      alt={item.image?.alt || item.title || 'related product'}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 md:text-base">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600">{item.price || '$0.00'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

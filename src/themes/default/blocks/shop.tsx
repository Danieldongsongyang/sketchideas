'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

type ShopGroup = {
  name: string;
  title: string;
};

type ShopItem = {
  slug?: string;
  title?: string;
  description?: string;
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
  cta_label?: string;
};

export function Shop({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const groups: ShopGroup[] = (section as any).groups || [];
  const [selectedGroup, setSelectedGroup] = useState<string>(
    groups.length > 0 ? groups[0].name : ''
  );

  const filteredItems = useMemo(() => {
    const items: ShopItem[] = section.items || [];
    if (!selectedGroup || !groups.length) return items;
    if (selectedGroup === 'all') return items;
    return items.filter((item) => item.group === selectedGroup);
  }, [section.items, selectedGroup, groups.length]) as ShopItem[];

  return (
    <section
      id={section.id || section.name}
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <motion.div
        className="container mb-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1] as const,
        }}
      >
        {section.sr_only_title && (
          <h1 className="sr-only">{section.sr_only_title}</h1>
        )}
        <h2 className="mx-auto mb-4 max-w-full text-3xl font-bold text-balance md:max-w-4xl lg:text-5xl">
          {section.title}
        </h2>
        <p className="text-muted-foreground mx-auto max-w-full text-sm md:max-w-3xl md:text-base">
          {section.description}
        </p>
      </motion.div>

      {groups.length > 0 && (
        <motion.div
          className="container mb-8 flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          {groups.map(
            (group: ShopGroup, index: number) => {
              const isSelected = selectedGroup === group.name;
              return (
                <motion.button
                  key={group.name}
                  onClick={() => setSelectedGroup(group.name)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:text-zinc-900'
                  )}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: 0.2 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{group.title}</span>
                </motion.button>
              );
            }
          )}
        </motion.div>
      )}

      <div className="container space-y-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            const detailHref = item.slug ? `/shop/${item.slug}` : '';
            const itemUrl = detailHref || item.url || '#';
            const itemTarget = detailHref ? '_self' : item.target || '_self';
            const priceLabel = item.price || 'Free';
            const ctaLabel = item.cta_label || 'View Pack';
            const ratingLabel =
              item.rating && item.reviews
                ? `${item.rating} (${item.reviews})`
                : item.rating || item.reviews || '';

            return (
              <motion.article
                key={`${item.title}-${index}`}
                className="group overflow-hidden rounded-2xl border border-zinc-900 bg-white shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_16px_38px_rgba(0,0,0,0.14)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
              >
                <div className="grid md:grid-cols-[58%_42%]">
                  <Link
                    href={itemUrl}
                    target={itemTarget}
                    className="relative block min-h-[250px] overflow-hidden bg-zinc-100 md:min-h-[355px]"
                  >
                    <Image
                      src={item.image?.src ?? ''}
                      alt={item.image?.alt ?? item.title ?? 'showcase'}
                      sizes="(max-width: 768px) 100vw, 60vw"
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {item.badge && (
                      <span className="absolute top-4 left-4 rounded-full border border-black/20 bg-white/92 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  <div className="flex min-h-[250px] flex-col p-5 md:min-h-[355px] md:p-7">
                    <h3 className="line-clamp-3 text-2xl leading-tight font-semibold text-zinc-900">
                      {item.title}
                    </h3>
                    <p
                      className="mt-3 line-clamp-2 text-base text-zinc-600"
                      dangerouslySetInnerHTML={{
                        __html: item.description ?? '',
                      }}
                    />

                    <div className="mt-5 flex items-center gap-3">
                      <div className="relative size-10 overflow-hidden rounded-full border border-zinc-300">
                        <Image
                          src={item.seller_avatar || '/imgs/avatars/1.png'}
                          alt={item.seller_name || 'seller'}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <p className="text-base leading-none font-semibold text-zinc-900">
                          {item.seller_name || 'Sketch Ideas'}
                        </p>
                        {item.seller_handle && (
                          <p className="mt-1 text-sm text-zinc-500">
                            {item.seller_handle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex rounded-lg border border-[#a54ea2]/60 bg-[#e778cd] px-4 py-1.5 text-2xl font-semibold text-black">
                          {priceLabel}
                        </span>
                        {ratingLabel && (
                          <span className="inline-flex items-center gap-2 text-xl font-semibold text-zinc-900">
                            <Star className="size-5 fill-current" />
                            {ratingLabel}
                          </span>
                        )}
                      </div>
                      <Button
                        asChild
                        className="mt-4 h-10 w-full rounded-full bg-zinc-900 text-sm text-white hover:bg-zinc-700"
                      >
                        <Link href={itemUrl} target={itemTarget}>
                          {ctaLabel}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })
        ) : (
          <motion.div
            className="text-muted-foreground text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            No items found in this category.
          </motion.div>
        )}
      </div>
    </section>
  );
}

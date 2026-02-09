'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, LoaderCircle, Sparkles } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

type CategoryOption = {
  value: string;
  label: string;
  count: number;
};

const DEFAULT_SPIN_DELAY_MS = 800;

export function SketchIdeasSpin({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [spinsCount, setSpinsCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const spinDelayMs = useMemo(() => {
    const customDelay = Number(section.spin_delay_ms);
    if (!Number.isFinite(customDelay) || customDelay <= 0) {
      return DEFAULT_SPIN_DELAY_MS;
    }
    return customDelay;
  }, [section.spin_delay_ms]);

  const currentCategoryLabel = useMemo(() => {
    return (
      categories.find((item) => item.value === currentCategory)?.label ||
      currentCategory
    );
  }, [categories, currentCategory]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        setLoadError(null);

        const response = await fetch('/api/lineart/categories', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`request failed: ${response.status}`);
        }

        const data = await response.json();
        const loadedCategories = Array.isArray(data?.categories)
          ? (data.categories as CategoryOption[]).filter((item) => {
              return (
                typeof item?.value === 'string' &&
                typeof item?.label === 'string' &&
                typeof item?.count === 'number'
              );
            })
          : [];

        if (!loadedCategories.length) {
          throw new Error('No categories found in lineart_part.');
        }

        setCategories(loadedCategories);
        setCurrentCategory((previous) => {
          if (
            previous &&
            loadedCategories.some((item) => item.value === previous)
          ) {
            return previous;
          }
          return loadedCategories[0].value;
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Failed to load lineart categories:', error);
        setCategories([]);
        setCurrentCategory('');
        setLoadError('Failed to load categories from lineart_part.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const spin = () => {
    if (isSpinning || !currentCategory) {
      return;
    }

    setIsSpinning(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const imageUrl = `/api/lineart/random?category=${encodeURIComponent(currentCategory)}&nonce=${nonce}`;
      setCurrentImage(imageUrl);
      setSpinsCount((prev) => prev + 1);
      setIsSpinning(false);
    }, spinDelayMs);
  };

  const hasResult = Boolean(currentImage);
  const canSpin = !isLoadingCategories && !!currentCategory;

  return (
    <section
      id={section.id}
      className={cn(
        'overflow-x-hidden py-16 md:py-24',
        section.className,
        className
      )}
    >
      <div className="container space-y-8 px-2 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl text-balance">
            {section.title && (
              <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-muted-foreground mt-3">{section.description}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside>
            <div className="bg-card rounded-2xl border p-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                Category
              </p>
              {isLoadingCategories && (
                <p className="text-muted-foreground text-sm">
                  Loading categories...
                </p>
              )}

              {!isLoadingCategories && loadError && (
                <p className="text-sm text-red-500">{loadError}</p>
              )}

              {!isLoadingCategories && !loadError && (
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {categories.map((item) => {
                    const isActive = currentCategory === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setCurrentCategory(item.value)}
                        className={cn(
                          'w-full rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:border-primary/40 hover:bg-muted'
                        )}
                      >
                        {item.label}
                        <span className="ml-2 opacity-70">({item.count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <div className="bg-card rounded-3xl border p-4 sm:p-6 md:p-8">
            <div className="bg-background flex min-h-[420px] items-center justify-center rounded-2xl border p-6 md:p-8">
              {isSpinning && (
                <div className="text-center">
                  <LoaderCircle className="text-primary mx-auto size-12 animate-spin" />
                  <p className="text-muted-foreground mt-4 text-sm">
                    Generating your idea...
                  </p>
                </div>
              )}

              {!isSpinning && !hasResult && (
                <div className="text-center">
                  <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                    <Sparkles className="text-primary size-8" />
                  </div>
                  <p className="text-foreground text-lg font-medium">
                    Ready to spin your next idea?
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Pick a category, then press SPIN.
                  </p>
                </div>
              )}

              {!isSpinning && hasResult && (
                <div className="mx-auto max-w-3xl">
                  <div className="mx-auto w-fit max-w-full rounded-2xl border bg-card p-3 md:p-4">
                    <div className="flex items-center justify-center overflow-hidden rounded-xl bg-background p-2 md:p-3">
                      <img
                        src={currentImage || ''}
                        alt={`${currentCategoryLabel} lineart`}
                        className="mx-auto block h-auto max-h-[60vh] w-auto max-w-full object-contain object-center md:max-h-[70vh]"
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <div className="rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
                        {currentCategoryLabel}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="hidden sm:block" aria-hidden="true" />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={spin}
                  disabled={isSpinning || !canSpin}
                >
                  <Sparkles className="size-4" />
                  SPIN
                </Button>
                {hasResult && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={spin}
                    disabled={isSpinning || !canSpin}
                  >
                    <ChevronRight className="size-4" />
                    NEXT
                  </Button>
                )}
              </div>
              <div className="bg-background text-muted-foreground justify-self-center whitespace-nowrap rounded-full border px-4 py-2 text-sm sm:justify-self-end">
                Spins:{' '}
                <span className="text-foreground font-semibold">
                  {spinsCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

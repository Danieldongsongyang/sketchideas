'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

type CategoryOption = {
  value: string;
  label: string;
  count: number;
};

const DEFAULT_SPIN_DELAY_MS = 800;
const TYPE_PLACEHOLDER = 'Choose a type';

function normalizeCategoryKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isWarmUpCategory(value: string) {
  const normalized = normalizeCategoryKey(value);
  return normalized === 'warmup';
}

function extensionFromMimeType(contentType: string) {
  const type = contentType.toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('bmp')) return 'bmp';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  return 'png';
}

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
  const [currentImageMimeType, setCurrentImageMimeType] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [spinsCount, setSpinsCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const currentImageBlobUrlRef = useRef<string | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement | null>(null);
  const imageViewportRef = useRef<HTMLDivElement | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

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

  async function loadCurrentImageFromCategory(
    category: string,
    options: { signal?: AbortSignal } = {}
  ) {
    const { signal } = options;
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const imageUrl = `/api/lineart/random?category=${encodeURIComponent(category)}&nonce=${nonce}`;
    const response = await fetch(imageUrl, { cache: 'no-store', signal });
    if (!response.ok) {
      throw new Error(`image request failed: ${response.status}`);
    }

    const blob = await response.blob();
    if (signal?.aborted) {
      return;
    }
    const blobUrl = URL.createObjectURL(blob);

    if (currentImageBlobUrlRef.current) {
      URL.revokeObjectURL(currentImageBlobUrlRef.current);
    }
    currentImageBlobUrlRef.current = blobUrl;
    setCurrentImage(blobUrl);
    setCurrentImageMimeType(
      blob.type || response.headers.get('Content-Type') || ''
    );
  }

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

        const warmUpCategory = loadedCategories.find((item) => {
          return isWarmUpCategory(item.value) || isWarmUpCategory(item.label);
        });
        const defaultCategory = warmUpCategory?.value || loadedCategories[0].value;

        setCategories(loadedCategories);
        setCurrentCategory((previous) => {
          if (
            previous &&
            loadedCategories.some((item) => item.value === previous)
          ) {
            return previous;
          }
          return defaultCategory;
        });

        // Show an initial random image on first load using the default category.
        await loadCurrentImageFromCategory(defaultCategory, {
          signal: controller.signal,
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
      if (currentImageBlobUrlRef.current) {
        URL.revokeObjectURL(currentImageBlobUrlRef.current);
        currentImageBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(target)
      ) {
        setIsTypeDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsImageFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
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

    timeoutRef.current = window.setTimeout(async () => {
      try {
        await loadCurrentImageFromCategory(currentCategory);
        setSpinsCount((prev) => prev + 1);
      } catch (error) {
        console.error('Failed to load lineart image:', error);
      } finally {
        setIsSpinning(false);
      }
    }, spinDelayMs);
  };

  const toggleImageFullscreen = async () => {
    if (!imageViewportRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await imageViewportRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  };

  const downloadCurrentImage = async () => {
    if (!currentImage || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const ext = extensionFromMimeType(currentImageMimeType || 'image/png');
      const fileNameBase = normalizeCategoryKey(currentCategoryLabel || 'lineart');
      const filename = `${fileNameBase || 'lineart'}-${Date.now()}.${ext}`;
      const anchor = document.createElement('a');
      anchor.href = currentImage;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error('Failed to download image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasResult = Boolean(currentImage);
  const canSpin = !isLoadingCategories && !!currentCategory;
  const isHeroPanelVariant = section.variant === 'hero-panel';
  const headline = section.title || 'AI Sketch Generator';
  const description =
    section.description ||
    'Choose a category and spin to get a random line-art reference in seconds.';
  const panelTitle = section.panel_title || 'Generate a New Sketch';

  return (
    <section
      id={section.id}
      className={cn(
        isHeroPanelVariant
          ? 'relative overflow-x-hidden pb-10 md:pb-14'
          : 'relative overflow-x-hidden py-14 md:py-20',
        section.className,
        className
      )}
    >
      {!isHeroPanelVariant && (
        <>
          <div className="absolute inset-0 -z-20 bg-[#f2e7e6] dark:bg-[#130d09]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(85%_80%_at_50%_0%,rgba(201,140,134,0.34)_0%,rgba(242,231,230,0.45)_70%)] dark:bg-[radial-gradient(85%_80%_at_50%_0%,rgba(185,120,66,0.26)_0%,rgba(21,14,10,0.96)_70%)]" />
        </>
      )}

      <div className="container px-2 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {!isHeroPanelVariant && (
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-[#5d4643] dark:text-amber-100 md:text-5xl">
                {headline}
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-[#705856] dark:text-zinc-300 md:text-lg">
                {description}
              </p>
            </div>
          )}
          <div
            className={cn(
              'relative overflow-hidden rounded-[30px] border border-[#dcb5b2]/85 bg-[#f3e5e4]/92 p-4 shadow-[0_25px_65px_rgba(116,74,70,0.24)] dark:border-amber-100/15 dark:bg-[#1a120d]/85 dark:shadow-[0_35px_90px_rgba(0,0,0,0.45)] md:p-7',
              isHeroPanelVariant ? 'mt-4 md:mt-6' : 'mt-8'
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_130%_at_50%_-10%,rgba(201,140,134,0.18)_0%,transparent_60%)] dark:bg-[radial-gradient(75%_130%_at_50%_-10%,rgba(247,168,92,0.18)_0%,transparent_60%)]" />

            <div className="relative space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold tracking-tight text-[#5f4a48] dark:text-zinc-100 md:text-4xl">
                  {panelTitle}
                </h3>
                <div className="rounded-full border border-[#dcb9b6]/85 bg-[#ecd9d7]/75 px-4 py-1.5 text-xs font-medium tracking-wide text-[#6b4f4c] uppercase dark:border-amber-200/20 dark:bg-black/35 dark:text-amber-100/90">
                  Live categories:{' '}
                  <span className="text-[#5d4542] dark:text-amber-200">
                    {categories.length}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#dec1bf]/80 bg-[#efe0df]/45 p-2.5 dark:border-amber-100/15 dark:bg-black/30 md:p-3">
                <div
                  className={cn(
                    'relative flex min-h-[430px] items-center justify-center rounded-xl p-4 md:min-h-[540px] md:p-6',
                    'bg-white'
                  )}
                  ref={imageViewportRef}
                >
                  {isSpinning && (
                    <div className="text-center">
                      <LoaderCircle className="mx-auto size-12 animate-spin text-zinc-700" />
                      <p className="mt-4 text-sm text-zinc-600">
                        Generating your idea...
                      </p>
                    </div>
                  )}

                  {!isSpinning && !hasResult && (
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-800/10">
                        <Sparkles className="size-8 text-zinc-700" />
                      </div>
                      <p className="text-lg font-medium text-zinc-800">
                        Ready to spin your next idea?
                      </p>
                      <p className="mt-2 text-sm text-zinc-600">
                        Pick a category, then press SPIN.
                      </p>
                    </div>
                  )}

                  {!isSpinning && hasResult && (
                    <>
                      <img
                        src={currentImage || ''}
                        alt={`${currentCategoryLabel} lineart`}
                        className={cn(
                          'block w-auto max-w-full object-contain object-center',
                          isImageFullscreen ? 'max-h-[98vh]' : 'max-h-[74vh]'
                        )}
                      />
                      <div className="absolute right-3 bottom-3 z-20 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          onClick={toggleImageFullscreen}
                          className="border border-white/20 bg-black/60 text-white hover:bg-black/75"
                          title={isImageFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        >
                          {isImageFullscreen ? (
                            <Minimize2 className="size-4" />
                          ) : (
                            <Maximize2 className="size-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          onClick={downloadCurrentImage}
                          disabled={isDownloading}
                          className="border border-white/20 bg-black/60 text-white hover:bg-black/75 disabled:opacity-60"
                          title="Download image"
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-1 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div
                  className="relative min-h-[40px] justify-self-center sm:justify-self-start"
                  ref={typeDropdownRef}
                >
                  <button
                    type="button"
                    onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
                    disabled={isLoadingCategories || !!loadError}
                    className={cn(
                      'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                      isTypeDropdownOpen
                        ? 'border-[#C98C86]/85 bg-[#f2dfde]/90 text-[#5d4542] dark:border-amber-300/60 dark:bg-amber-400/30 dark:text-amber-50'
                        : 'border-[#e0c7c4]/85 bg-[#f8eceb]/85 text-[#6f5350] hover:border-[#C98C86]/80 hover:text-[#5b4340] dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-amber-200/45 dark:hover:text-amber-100',
                      (isLoadingCategories || !!loadError) &&
                        'cursor-not-allowed opacity-60'
                    )}
                    aria-expanded={isTypeDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    {isLoadingCategories
                      ? 'Loading types...'
                      : loadError
                        ? 'Type unavailable'
                        : currentCategoryLabel || TYPE_PLACEHOLDER}
                    <ChevronDown
                      className={cn(
                        'size-4 transition-transform',
                        isTypeDropdownOpen ? 'rotate-180' : ''
                      )}
                    />
                  </button>

                  {isTypeDropdownOpen && !isLoadingCategories && !loadError && (
                    <div className="absolute bottom-full left-1/2 z-30 mb-3 w-[320px] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#ddbcba]/85 bg-[#f7eceb]/96 shadow-[0_18px_40px_rgba(116,74,70,0.24)] dark:border-amber-100/20 dark:bg-[#17100c] dark:shadow-[0_20px_45px_rgba(0,0,0,0.45)] sm:left-0 sm:w-[560px] sm:translate-x-0">
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        <div
                          className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
                          role="listbox"
                        >
                          {categories.map((item) => {
                            const isActive = currentCategory === item.value;
                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  setCurrentCategory(item.value);
                                  setIsTypeDropdownOpen(false);
                                }}
                                className={cn(
                                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                                  isActive
                                    ? 'border-[#C98C86]/85 bg-[#efd9d8]/85 text-[#5d4542] dark:border-amber-300/60 dark:bg-amber-400/20 dark:text-amber-100'
                                    : 'border-transparent text-[#5f4a48] hover:border-[#d7afac]/85 hover:bg-[#f0e0df]/70 dark:text-zinc-200 dark:hover:border-amber-200/35 dark:hover:bg-white/5'
                                )}
                              >
                                <span className="font-medium">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={spin}
                    disabled={isSpinning || !canSpin}
                    className="rounded-full bg-[#C98C86] px-7 text-[#fff9f1] hover:bg-[#B67973]"
                  >
                    <Sparkles className="size-4" />
                    SPIN
                  </Button>
                </div>
                <div className="justify-self-center whitespace-nowrap rounded-full border border-[#dcb8b5]/85 bg-[#f1e0de]/78 px-4 py-2 text-sm text-[#6d5351] dark:border-zinc-100/15 dark:bg-zinc-950/45 dark:text-zinc-100/85 sm:justify-self-end">
                  Spins:{' '}
                  <span className="font-semibold text-[#5d4542] dark:text-amber-200">
                    {spinsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

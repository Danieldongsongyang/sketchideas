'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SmartIcon } from '@/shared/blocks/common';
import { PaymentModal } from '@/shared/blocks/payment/payment-modal';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useAppContext } from '@/shared/contexts/app';
import { getCookie } from '@/shared/lib/cookie';
import { cn } from '@/shared/lib/utils';
import { Subscription } from '@/shared/models/subscription';
import {
  PricingCurrency,
  PricingItem,
  Pricing as PricingType,
} from '@/shared/types/blocks/pricing';

// Helper function to get all available currencies from a pricing item
function getCurrenciesFromItem(item: PricingItem | null): PricingCurrency[] {
  if (!item) return [];

  // Always include the default currency first
  const defaultCurrency: PricingCurrency = {
    currency: item.currency,
    amount: item.amount,
    price: item.price || '',
    original_price: item.original_price || '',
  };

  // Add additional currencies if available
  if (item.currencies && item.currencies.length > 0) {
    return [defaultCurrency, ...item.currencies];
  }

  return [defaultCurrency];
}

// Helper function to select initial currency based on locale
function getInitialCurrency(
  currencies: PricingCurrency[],
  locale: string,
  defaultCurrency: string
): string {
  if (currencies.length === 0) return defaultCurrency;

  // If locale is 'zh', prefer CNY
  if (locale === 'zh') {
    const cnyCurrency = currencies.find(
      (c) => c.currency.toLowerCase() === 'cny'
    );
    if (cnyCurrency) {
      return cnyCurrency.currency;
    }
  }

  // Otherwise return default currency
  return defaultCurrency;
}

export function Pricing({
  section,
  className,
  currentSubscription,
}: {
  section: PricingType;
  className?: string;
  currentSubscription?: Subscription;
}) {
  const locale = useLocale();
  const t = useTranslations('pages.pricing.messages');

  const {
    user,
    isShowPaymentModal,
    setIsShowSignModal,
    setIsShowPaymentModal,
    configs,
  } = useAppContext();

  const [group, setGroup] = useState(() => {
    // find current pricing item
    const currentItem = section.items?.find(
      (i) => i.product_id === currentSubscription?.productId
    );

    // First look for a group with is_featured set to true
    const featuredGroup = section.groups?.find((g) => g.is_featured);
    // If no featured group exists, fall back to the first group
    return (
      currentItem?.group || featuredGroup?.name || section.groups?.[0]?.name
    );
  });

  // current pricing item
  const [pricingItem, setPricingItem] = useState<PricingItem | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  // Currency state management for each item
  // Store selected currency and displayed item for each product_id
  const [itemCurrencies, setItemCurrencies] = useState<
    Record<string, { selectedCurrency: string; displayedItem: PricingItem }>
  >({});

  // Initialize currency states for all items
  useEffect(() => {
    if (section.items && section.items.length > 0) {
      const initialCurrencyStates: Record<
        string,
        { selectedCurrency: string; displayedItem: PricingItem }
      > = {};

      section.items.forEach((item) => {
        const currencies = getCurrenciesFromItem(item);
        const selectedCurrency = getInitialCurrency(
          currencies,
          locale,
          item.currency
        );

        // Create displayed item with selected currency
        const currencyData = currencies.find(
          (c) => c.currency.toLowerCase() === selectedCurrency.toLowerCase()
        );

        const displayedItem = currencyData
          ? {
              ...item,
              currency: currencyData.currency,
              amount: currencyData.amount,
              price: currencyData.price,
              original_price: currencyData.original_price,
              // Override with currency-specific payment settings if available
              payment_product_id:
                currencyData.payment_product_id || item.payment_product_id,
              payment_providers:
                currencyData.payment_providers || item.payment_providers,
            }
          : item;

        initialCurrencyStates[item.product_id] = {
          selectedCurrency,
          displayedItem,
        };
      });

      setItemCurrencies(initialCurrencyStates);
    }
  }, [section.items, locale]);

  // Handler for currency change
  const handleCurrencyChange = (productId: string, currency: string) => {
    const item = section.items?.find((i) => i.product_id === productId);
    if (!item) return;

    const currencies = getCurrenciesFromItem(item);
    const currencyData = currencies.find(
      (c) => c.currency.toLowerCase() === currency.toLowerCase()
    );

    if (currencyData) {
      const displayedItem = {
        ...item,
        currency: currencyData.currency,
        amount: currencyData.amount,
        price: currencyData.price,
        original_price: currencyData.original_price,
        // Override with currency-specific payment settings if available
        payment_product_id:
          currencyData.payment_product_id || item.payment_product_id,
        payment_providers:
          currencyData.payment_providers || item.payment_providers,
      };

      setItemCurrencies((prev) => ({
        ...prev,
        [productId]: {
          selectedCurrency: currency,
          displayedItem,
        },
      }));
    }
  };

  const handlePayment = async (item: PricingItem) => {
    if ((item.amount || 0) <= 0) {
      window.location.href = item.button?.url || '/';
      return;
    }

    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    // Use displayed item with selected currency
    const displayedItem =
      itemCurrencies[item.product_id]?.displayedItem || item;

    if (configs.select_payment_enabled === 'true') {
      setPricingItem(displayedItem);
      setIsShowPaymentModal(true);
    } else {
      handleCheckout(displayedItem, configs.default_payment_provider);
    }
  };

  const getAffiliateMetadata = ({
    paymentProvider,
  }: {
    paymentProvider: string;
  }) => {
    const affiliateMetadata: Record<string, string> = {};

    // get Affonso referral
    if (
      configs.affonso_enabled === 'true' &&
      ['stripe', 'creem'].includes(paymentProvider)
    ) {
      const affonsoReferral = getCookie('affonso_referral') || '';
      affiliateMetadata.affonso_referral = affonsoReferral;
    }

    // get PromoteKit referral
    if (
      configs.promotekit_enabled === 'true' &&
      ['stripe'].includes(paymentProvider)
    ) {
      const promotekitReferral =
        typeof window !== 'undefined' && (window as any).promotekit_referral
          ? (window as any).promotekit_referral
          : getCookie('promotekit_referral') || '';
      affiliateMetadata.promotekit_referral = promotekitReferral;
    }

    return affiliateMetadata;
  };

  const handleCheckout = async (
    item: PricingItem,
    paymentProvider?: string
  ) => {
    try {
      if (!user) {
        setIsShowSignModal(true);
        return;
      }

      const affiliateMetadata = getAffiliateMetadata({
        paymentProvider: paymentProvider || '',
      });

      const params = {
        product_id: item.product_id,
        currency: item.currency,
        locale: locale || 'en',
        payment_provider: paymentProvider || '',
        metadata: affiliateMetadata,
      };

      setIsLoading(true);
      setProductId(item.product_id);

      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);
        setPricingItem(null);
        setIsShowSignModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`request failed with status ${response.status}`);
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        throw new Error(message);
      }

      const { checkoutUrl } = data;
      if (!checkoutUrl) {
        throw new Error('checkout url not found');
      }

      window.location.href = checkoutUrl;
    } catch (e: any) {
      console.log('checkout failed: ', e);
      toast.error('checkout failed: ' + e.message);

      setIsLoading(false);
      setProductId(null);
    }
  };

  useEffect(() => {
    if (section.items) {
      const featuredItem = section.items.find((i) => i.is_featured);
      setProductId(featuredItem?.product_id || section.items[0]?.product_id);
      setIsLoading(false);
    }
  }, [section.items]);

  const visibleItems =
    section.items?.filter((item) => !item.group || item.group === group) || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative py-16 md:py-24',
        section.className,
        className
      )}
    >
      <div className="container">
        <div className="rounded-3xl border border-[#b9c8db]/70 bg-[linear-gradient(145deg,rgba(248,251,255,0.95),rgba(233,241,251,0.92))] p-6 shadow-[0_20px_50px_rgba(58,75,96,0.12)] md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            {section.sr_only_title && (
              <h1 className="sr-only">{section.sr_only_title}</h1>
            )}
            <h2 className="text-3xl font-bold text-balance text-[#243245] md:text-5xl">
              {section.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[#4b5c73] md:text-lg">
              {section.description}
            </p>
          </div>

          {section.groups && section.groups.length > 0 && (
            <div className="mx-auto mt-8 flex w-full justify-center">
              <div className="w-full text-center">
                <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[#6d7f97] uppercase">
                  Billing Cycle
                </p>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#c4d2e3] bg-white/80 p-2 shadow-[0_8px_20px_rgba(56,74,97,0.1)]">
                {section.groups.map((item, i) => {
                  const selected = group === item.name;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setGroup(item.name || '')}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                        selected
                          ? 'bg-[#20242e] text-white'
                          : 'text-[#4f6078] hover:bg-[#eef3fb]'
                      )}
                    >
                      {item.title}
                      {item.label && (
                        <Badge className="h-5 rounded-full border-0 bg-[#c98c86] px-2 text-[10px] text-white">
                          {item.label}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            'mx-auto mt-8 grid w-full gap-6',
            visibleItems.length === 1 && 'max-w-xl',
            visibleItems.length === 2 && 'max-w-5xl md:grid-cols-2',
            visibleItems.length >= 3 && 'md:grid-cols-3'
          )}
        >
          {visibleItems.map((item: PricingItem, idx) => {
            let isCurrentPlan = false;
            if (
              currentSubscription &&
              currentSubscription.productId === item.product_id
            ) {
              isCurrentPlan = true;
            }

            // Get currency state for this item
            const currencyState = itemCurrencies[item.product_id];
            const displayedItem = currencyState?.displayedItem || item;
            const selectedCurrency =
              currencyState?.selectedCurrency || item.currency;
            const currencies = getCurrenciesFromItem(item);

            const isFeatured = Boolean(item.is_featured);

            return (
              <div
                key={item.product_id || idx}
                className={cn(
                  'relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-[0_14px_35px_rgba(57,75,95,0.12)] transition-transform md:p-7',
                  isFeatured
                    ? 'border-2 border-[#c98c86] shadow-[0_18px_42px_rgba(201,140,134,0.28)] md:-translate-y-1'
                    : 'border-[#c2d1e3]'
                )}
              >
                {item.label && (
                  <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-[#20242e] px-3 py-1 text-xs font-semibold tracking-wide text-white">
                    {item.label}
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-semibold text-[#1f2d40]">
                    {item.title}
                  </h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#5b6c83]">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 flex items-end gap-2">
                  {displayedItem.original_price && (
                    <span className="text-sm text-[#8a99ac] line-through">
                      {displayedItem.original_price}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-[#1b2636]">
                    {displayedItem.price}
                  </span>
                  {displayedItem.unit && (
                    <span className="pb-1 text-sm text-[#6e7f96]">
                      {displayedItem.unit}
                    </span>
                  )}
                </div>

                {currencies.length > 1 && (
                  <div className="mt-3">
                    <Select
                      value={selectedCurrency}
                      onValueChange={(currency) =>
                        handleCurrencyChange(item.product_id, currency)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="h-8 w-[96px] border-[#c4d2e3] bg-white text-xs"
                      >
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.currency}
                            value={currency.currency}
                            className="text-xs"
                          >
                            {currency.currency.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <p className="mt-3 min-h-[3.5rem] text-sm text-[#6e7f96]">
                  {item.tip || ' '}
                </p>

                {isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="mt-5 h-10 w-full rounded-full border-[#c2d1e3] bg-white text-sm text-[#2b3a4f]"
                    disabled
                  >
                    <span className="block">{t('current_plan')}</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePayment(item)}
                    disabled={isLoading}
                    className={cn(
                      'mt-5 h-10 w-full rounded-full text-sm font-semibold',
                      isFeatured
                        ? 'bg-[#20242e] text-white hover:bg-[#11151d]'
                        : 'bg-[#e8eef8] text-[#1f2d40] hover:bg-[#d8e3f5]'
                    )}
                  >
                    {isLoading && item.product_id === productId ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span className="block">{t('processing')}</span>
                      </>
                    ) : (
                      <>
                        {item.button?.icon && (
                          <SmartIcon
                            name={item.button?.icon as string}
                            className="size-4"
                          />
                        )}
                        <span className="block">{item.button?.title}</span>
                      </>
                    )}
                  </Button>
                )}

                <div className="mt-6 border-t border-dashed border-[#d2deec] pt-5">
                  {item.features_title && (
                    <p className="mb-3 text-sm font-semibold text-[#2a3a4d]">
                      {item.features_title}
                    </p>
                  )}
                  <ul className="space-y-2.5 text-sm text-[#4f6078]">
                    {item.features?.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 text-[#1e7d47]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PaymentModal
        isLoading={isLoading}
        pricingItem={pricingItem}
        onCheckout={(item, paymentProvider) =>
          handleCheckout(item, paymentProvider)
        }
      />
    </section>
  );
}

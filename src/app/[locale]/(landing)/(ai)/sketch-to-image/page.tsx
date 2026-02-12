import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { ImageGenerator } from '@/shared/blocks/generator';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: 'Sketch to Image',
  metadataKey: 'ai.sketch_to_image.metadata',
  canonicalUrl: '/sketch-to-image',
});

export default async function SketchToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // get ai image data
  const t = await getTranslations('ai.sketch_to_image');
  const pageTitle = 'Sketch to Image';

  // build page sections
  const page: DynamicPage = {
    sections: {
      hero: {
        title: pageTitle,
        description: t.raw('page.description'),
        background_image: {
          src: '/imgs/bg/tree.jpg',
          alt: 'hero background',
        },
      },
      generator: {
        component: (
          <ImageGenerator
            srOnlyTitle={pageTitle}
            translationNamespace="ai.sketch_to_image.generator"
            allowedTabs={['image-to-image']}
            defaultTab="image-to-image"
            showTabs={false}
          />
        ),
      },
    },
  };

  // load page component
  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}

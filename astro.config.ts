import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkCollapse from 'remark-collapse';
import remarkToc from 'remark-toc';

import { SITE } from './src/config';
import { remarkReadingTime } from './src/utils/remark-plugins/remark-reading-time';

// https://astro.build/config
export default defineConfig({
    site: SITE.website,
    integrations: [
        tailwind({
            applyBaseStyles: false,
        }),
        react(),
        sitemap(),
    ],
    markdown: {
        remarkPlugins: [
            remarkToc,
            remarkReadingTime,
            [
                remarkCollapse,
                {
                    test: 'Table of contents',
                },
            ],
        ],
        shikiConfig: {
            theme: 'one-dark-pro',
            wrap: true,
        },
    },
    vite: {
        optimizeDeps: {
            exclude: ['@resvg/resvg-js'],
        },
    },
    scopedStyleStrategy: 'where',
});

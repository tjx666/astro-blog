import fs from 'node:fs/promises';
import { resolve } from 'node:path';

import { type CollectionEntry } from 'astro:content';

import { Resvg } from '@resvg/resvg-js';
import satori, { type SatoriOptions } from 'satori';

import { projectRoot } from './constants';
import postOgImage from './og-templates/post';
import siteOgImage from './og-templates/site';

const fetchFonts = async () =>
    Promise.all(
        ['Regular', 'Bold'].map(async (weight) =>
            fs.readFile(
                resolve(projectRoot, `src/assets/fonts/lxgw-wenkai/LXGWWenKaiMono-${weight}.ttf`),
            ),
        ),
    );

const [fontRegular, fontBold] = await fetchFonts();

const options: SatoriOptions = {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts: [
        {
            name: 'LXGW WenKai Mono',
            data: fontRegular,
            weight: 400,
            style: 'normal',
        },
        {
            name: 'LXGW WenKai Mono',
            data: fontBold,
            weight: 600,
            style: 'normal',
        },
    ],
};

function svgBufferToPngBuffer(svg: string) {
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    return pngData.asPng();
}

export async function generateOgImageForPost(post: CollectionEntry<'blog'>) {
    const svg = await satori(postOgImage(post), options);
    return svgBufferToPngBuffer(svg);
}

export async function generateOgImageForSite() {
    const svg = await satori(siteOgImage(), options);
    return svgBufferToPngBuffer(svg);
}

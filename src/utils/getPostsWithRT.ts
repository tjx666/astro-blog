import type { CollectionEntry } from 'astro:content';

import { slugifyStr } from './slugify';

export const getReadingTime = async () => {
    const globPosts = import.meta.glob<{ frontmatter: Frontmatter }>('../content/blog/*.md');
    const mapFrontmatter = new Map();
    const globPostsValues = Object.values(globPosts);
    await Promise.all(
        globPostsValues.map(async (globPost) => {
            const { frontmatter } = await globPost();
            mapFrontmatter.set(slugifyStr(frontmatter.title), frontmatter.readingTime);
        }),
    );

    return mapFrontmatter;
};

const getPostsWithRT = async (posts: Array<CollectionEntry<'blog'>>) => {
    const mapFrontmatter = await getReadingTime();
    return posts.map((post) => {
        post.data.readingTime = mapFrontmatter.get(slugifyStr(post.data.title));
        return post;
    });
};

export default getPostsWithRT;

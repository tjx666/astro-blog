import type { CollectionEntry } from 'astro:content';

import getPostsWithRT from './getPostsWithRT';
import postFilter from './postFilter';

const getSortedPosts = async (posts: Array<CollectionEntry<'blog'>>) => {
    const postsWithRT = await getPostsWithRT(posts);
    return postsWithRT
        .filter(postFilter)
        .sort(
            (a, b) =>
                Math.floor(new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000) -
                Math.floor(new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000),
        );
};

export default getSortedPosts;

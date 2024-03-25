import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';
import type { Plugin } from 'unified';

export const remarkReadingTime: Plugin<void[], Root> = () => {
    return function (tree, file) {
        const { data } = file as RemarkVFile;
        const textOnPage = toString(tree);
        const readingTime = getReadingTime(textOnPage);
        data.astro.frontmatter.readingTime = `${Math.round(readingTime.minutes)}分钟`;
    };
};

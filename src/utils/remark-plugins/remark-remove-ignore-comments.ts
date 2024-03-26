import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export const remarkRemoveIgnoreComments: Plugin<void[], Root> = () => {
    const validateLangs = new Set(['javascript', 'js', 'typescript', 'ts']);
    const commentPrefixes = [
        '// autocorrect-disable',
        '// autocorrect-enable',
        '// eslint-disable-',
        '// prettier-ignore',
    ];
    return function (tree) {
        visit(tree, 'code', (node) => {
            if (node.lang && validateLangs.has(node.lang)) {
                const lines = node.value.split('\n');
                const filteredLines = lines.filter((line) => {
                    return commentPrefixes.every((prefix) => !line.startsWith(prefix));
                });
                node.value = filteredLines.join('\n');
            }
        });
    };
};

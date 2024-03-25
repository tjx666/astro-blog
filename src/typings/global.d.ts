interface SetThemeData {
    newTheme: string;
}

interface WindowEventMap {
    'blog:setTheme': CustomEvent<SetThemeData>;
}

type Frontmatter = CollectionEntry<'blog'>['data'];
type RemarkVFile = import('vfile').VFile & {
    data: {
        astro: {
            frontmatter: Frontmatter;
        };
    };
};

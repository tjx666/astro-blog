import { useTheme } from '@composables/useTheme';
import Giscus from '@giscus/react';

export default function Comments() {
    const theme = useTheme();

    return (
        <Giscus
            id="comments"
            repo="tjx666/blog-comments"
            repoId="R_kgDOLlBP1g"
            category="Announcements"
            categoryId="DIC_kwDOLlBP1s4CeNLg"
            mapping="pathname"
            strict="0"
            term="Welcome to @giscus/react component!"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="bottom"
            lang="zh-CN"
            theme={theme === 'light' ? 'light' : 'dark'}
            loading="lazy"
        />
    );
}

import { useEffect, useState } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState(window.localStorage.getItem('theme') ?? 'light');

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            setTheme(e.detail.newTheme);
        };

        // @ts-expect-error custom event
        window.addEventListener('blog:setTheme', handler);
        return () => {
            // @ts-expect-error custom event
            window.removeEventListener('blog:setTheme', handler);
        };
    }, []);

    return theme;
};

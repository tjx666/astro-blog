import { useEffect, useState } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState(globalThis.localStorage.getItem('theme') ?? 'light');

    useEffect(() => {
        const handler = (e: CustomEvent<SetThemeData>) => {
            setTheme(e.detail.newTheme);
        };

        globalThis.addEventListener('blog:setTheme', handler);
        return () => {
            globalThis.removeEventListener('blog:setTheme', handler);
        };
    }, []);

    return theme;
};

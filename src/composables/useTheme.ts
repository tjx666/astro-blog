import { useEffect, useState } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState(window.localStorage.getItem('theme') ?? 'light');

    useEffect(() => {
        const handler = (e: CustomEvent<SetThemeData>) => {
            setTheme(e.detail.newTheme);
        };

        window.addEventListener('blog:setTheme', handler);
        return () => {
            window.removeEventListener('blog:setTheme', handler);
        };
    }, []);

    return theme;
};

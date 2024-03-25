interface SetThemeData {
    newTheme: string;
}

interface WindowEventMap {
    'blog:setTheme': CustomEvent<SetThemeData>;
}

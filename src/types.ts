import type socialIcons from '@assets/socialIcons';

export interface Site {
    website: string;
    author: string;
    desc: string;
    title: string;
    ogImage?: string;
    lightAndDarkMode: boolean;
    postPerPage: number;
    scheduledPostMargin: number;
}

export type SocialObjects = Array<{
    name: keyof typeof socialIcons;
    href: string;
    active: boolean;
    linkTitle: string;
    openInNewTab?: boolean;
}>;

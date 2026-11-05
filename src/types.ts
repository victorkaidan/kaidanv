export type ImageInput = {
    src: ImageMetadata | string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
    target?: '_blank' | '_self' | '_parent' | '_top';
};

export type Hero = {
    /** A "\n" marks where the line breaks on desktop; phones wrap naturally. */
    title?: string;
    /** Short intro paragraph between the title and the action buttons. */
    lead?: string;
    text?: string;
    image?: ImageInput;
    actions?: Link[];
};

export type SubscribeForm = {
    action: string;
    emailFieldName?: string;
    hiddenFields?: { name: string; value: string }[];
    honeypotFieldName?: string;
};

export type Subscribe = {
    enabled?: boolean;
    title?: string;
    text?: string;
    form?: SubscribeForm;
};

export type SiteConfig = {
    website: string;
    avatar?: ImageInput;
    title: string;
    subtitle?: string;
    description: string;
    image?: ImageInput;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
    projectsPerPage?: number;
};

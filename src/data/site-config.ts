import type { SiteConfig } from '../types';

const siteConfig: SiteConfig = {
    website: 'https://kaidanv.com',
    avatar: {
        src: '/avatar.jpg',
        alt: 'Victor Kaidan'
    },
    title: 'Victor Kaidan',
    subtitle: 'AI-era Product & Design Leader',
    description:
        'AI-era Product & Design Leader at Sisense. Leading UX strategy and design practice through PLG transformation and AI-native product evolution.',
    image: {
        src: '/social-preview.jpg',
        alt: 'Victor Kaidan - AI-era Product & Design Leader'
    },
    headerNavLinks: [
        { text: 'About', href: '/' },
        { text: 'Leadership', href: '/leadership' },
        { text: 'Earlier work', href: '/projects' }
    ],
    footerNavLinks: [
        { text: 'About', href: '/' },
        { text: 'Leadership', href: '/leadership' },
        { text: 'Earlier work', href: '/projects' }
    ],
    socialLinks: [
        { text: 'LinkedIn', href: 'https://www.linkedin.com/in/kaidan' },
        { text: 'CV', href: '/cv/victor_kaidan_cv.pdf' }
    ],
    hero: {
        title: 'Architecting Products and Design Teams for the AI Era',
        text: `Hi, I'm Director of Product Design at Sisense, where I lead UX strategy across the product portfolio and contribute directly to product strategy and roadmap. My current focus is shaping two major transformations: the company's shift to a PLG model and the platform's AI-native evolution - from defining its vision and product concept to roadmap planning and prioritization.

Design at this scale is less about producing artifacts and more about shaping the system that produces them. The ultimate leverage point for me isn't any single flow or even the whole product - it's how the design practice is organized inside the business, and how Product Design partners with Product Management and Engineering as a peer function rather than a service.

This organizational foundation is especially critical now, as AI rewrites what design work actually consists of. The goal today isn't just adopting new tools, but reshaping the entire design process around AI as a working material. It means designing products prepared for the agentic workflows customers are starting to build - and integrating design into the product-engineering cycle, shipping value as one cohesive unit rather than handing off screens.

Prior to my current role, I spent over two decades building large-scale products and leading design teams across enterprise SaaS, fintech, and consumer tech - at times owning the full product lifecycle, from research and PRDs to delivery.

For career details, see my [CV](/cv/victor_kaidan_cv.pdf). To talk shop, just drop me a line at [victor.kaidan@gmail.com](mailto:victor.kaidan@gmail.com).`
    },
    subscribe: {
        enabled: false
    },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;

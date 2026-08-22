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
        'AI-era Product & Design Leader. Leading UX strategy and design practice through AI-native transformation and the shift to PLG.',
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
        text: `Hi, I'm a Product & Design Leader working at the level where UX strategy, a design practice, and product strategy are one job - directing design across a platform rather than a single product, and shaping the roadmap it runs on. My focus is the operating model itself: AI-native transformation, shifts to a PLG motion, and how Product, Design, and Engineering are wired to each other.

Design at this scale is less about producing artifacts and more about shaping the system that produces them. The ultimate leverage point for me isn't any single flow or even the whole product - it's how the design practice is organized inside the business, and how Product Design partners with Product Management and Engineering as a peer function rather than a service.

This organizational foundation is especially critical now, as AI rewrites what design work actually consists of. The goal today isn't just adopting new tools, but reshaping the entire design process around AI as a working material. It means designing products prepared for the agentic workflows customers are starting to build - and integrating design into the product-engineering cycle, shipping value as one cohesive unit rather than handing off screens.

Behind that sit over two decades of building large-scale products and leading design teams across enterprise SaaS, fintech, and consumer tech - at times owning the full product lifecycle, from research and PRDs to delivery.

Alongside that, I advise teams reorganizing their design practice around AI - the operating model, the design system, and the loop between Product, Design, and Engineering.

For career details, see my [CV](/cv/victor_kaidan_cv.pdf). To talk shop, just drop me a line at [victor.kaidan@gmail.com](mailto:victor.kaidan@gmail.com).`
    },
    subscribe: {
        enabled: false
    },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;

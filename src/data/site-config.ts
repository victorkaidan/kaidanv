import type { SiteConfig } from '../types';

const siteConfig: SiteConfig = {
    website: 'https://kaidanv.com',
    avatar: {
        src: '/avatar.jpg',
        alt: 'Victor Kaidan'
    },
    title: 'Victor Kaidan',
    subtitle: 'UX | Product Design Leader',
    description:
        'UX expert and Product Design Leader. Shaping tech complexity into user simplicity through cross-disciplinary design.',
    image: {
        src: '/social-preview.jpg',
        alt: 'Victor Kaidan — UX | Product Design Leader'
    },
    headerNavLinks: [
        { text: 'About', href: '/' },
        { text: 'Work', href: '/projects' },
        { text: 'CV', href: '/cv/victor_kaidan_cv-2024.pdf', target: '_blank' }
    ],
    footerNavLinks: [
        { text: 'About', href: '/' },
        { text: 'Contact', href: 'mailto:victor.kaidan@gmail.com' }
    ],
    socialLinks: [
        { text: 'LinkedIn', href: 'https://www.linkedin.com/in/kaidan' }
    ],
    hero: {
        title: 'Architecting Smart User Experiences through Cross-Disciplinary Design',
        text:
            "I'm a UX expert and Product Design Leader with 20+ years of experience, " +
            'committed to crafting seamless user experiences that drive business success. ' +
            'My cross-disciplinary approach combines Design Thinking and UX methodologies ' +
            'with insights from product management, marketing and psychology.',
        actions: [{ text: 'Get in Touch', href: 'mailto:victor.kaidan@gmail.com' }]
    },
    subscribe: {
        enabled: false
    },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;

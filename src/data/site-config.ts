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
        { text: 'Selected projects', href: '/projects' }
    ],
    footerNavLinks: [
        { text: 'About', href: '/' },
        { text: 'Leadership', href: '/leadership' },
        { text: 'Selected projects', href: '/projects' }
    ],
    socialLinks: [
        { text: 'LinkedIn', href: 'https://www.linkedin.com/in/kaidan' },
        { text: 'CV', href: '/cv/victor_kaidan_cv.pdf' }
    ],
    hero: {
        title: 'Building Products and Design Teams for the AI Era',
        text: `## Who I am

Hi, I'm Victor. For about twenty years, I've been developing products and leading design teams in enterprise SaaS and consumer tech. Most recently, that meant forming the design function for a complex B2B analytics platform: owning UX strategy, budget, and the operating model, reporting to the CPTO, and shaping product strategy as part of the steering committee.

I embrace a scientific approach and systems thinking: perhaps due to my background in the life sciences, it has always been important to me to understand how the system works as a whole, beyond my immediate area of responsibility. Throughout my career, this has led me to study behavioral psychology, programming, software architecture, and machine learning. The ability to understand and think through code has transformed my way of working with engineers and designing complex systems. That same curiosity has led me through the fields of product management, growth marketing, and conversion optimization, each of which has shaped how I design solutions and manage processes. All of this together has given me the habit of approaching tasks through a business lens - I evaluate every decision in the context of the entire system: considering user interests along with the teams and processes it affects and how it contributes to the company's success.

## Leading teams

A design team's value depends on the conditions in which it operates: from empowering management, clear strategy, and room to grow to the way it collaborates with the product and engineering teams and the role it plays in roadmap planning. Once that's in place, quality becomes repeatable. Those conditions are where I focus most of my effort. For me, this involved hiring and developing designers, and evolving the multicultural team through reorganizations while creating and maintaining a productive working atmosphere and people's motivation.

## Product direction

The challenges I find most interesting today sit on both sides of integrating AI into a business - external (the product itself) and internal (the company's efficiency).

On the product side, the question is what customers need once AI agents start doing part of their work. I directed the design of an AI assistant from concept to release, and defined and prototyped an agent-based product vision adopted as the platform's direction by leadership. My work on product-led growth included a self-service trial and an information architecture overhaul, letting new users reach value without a sales call.

## Operating model

On the internal side, while AI is accelerating product development, the design, product, and engineering teams progress at different speeds, and the handoff points between stages become the slowest part. As I see it, the solution is to allow teams to build beyond their function, while each discipline keeps ownership of its own area. This idea, which I developed into a product lifecycle framework called [The Shared Loop](/leadership/shared-loop/), was adopted by the company as its standard process. Getting there also meant moving the team to AI-assisted work and pushing through early resistance until it became the norm.

---

I'm happy to be useful to companies going through this kind of change, as part of the leadership team or as an advisor. If you'd like to talk about work, or just talk shop, drop me a line at [victor.kaidan@gmail.com](mailto:victor.kaidan@gmail.com).`
    },
    subscribe: {
        enabled: false
    },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;

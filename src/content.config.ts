import { glob } from 'astro/loaders';
import { defineCollection, z, type ImageFunction } from 'astro:content';

const imageSchema = (_image: ImageFunction) =>
    z.object({
        // Plain URL string pointing into public/ (e.g. /uploads/2019/12/cover.png).
        // We don't run frontmatter images through Astro's asset pipeline — the
        // migrated case study images are already sized correctly from WordPress,
        // and BaseHead handles string srcs directly for OG meta.
        src: z.string(),
        alt: z.string().optional()
    });

const seoSchema = (image: ImageFunction) =>
    z.object({
        title: z.string().min(5).max(120).optional(),
        description: z.string().min(15).max(160).optional(),
        image: imageSchema(image).optional(),
        pageType: z.enum(['website', 'article']).default('website')
    });

const blog = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            excerpt: z.string().optional(),
            publishDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            isFeatured: z.boolean().default(false),
            tags: z.array(z.string()).default([]),
            seo: seoSchema(image).optional()
        })
});

const pages = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            seo: seoSchema(image).optional()
        })
});

const projects = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string().optional(),
            publishDate: z.coerce.date(),
            isFeatured: z.boolean().default(false),
            // When true, the page still builds at /projects/<slug>/ so the direct
            // link works, but the project is hidden from the listing, featured
            // grid, sitemap, and gets a noindex meta. Use for private case
            // studies you only want to share via a known URL.
            draft: z.boolean().default(false),
            seo: seoSchema(image).optional()
        })
});

export const collections = { blog, pages, projects };

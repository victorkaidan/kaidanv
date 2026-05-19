import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import siteConfig from './src/data/site-config';

// Collect slugs of draft projects at config-load time so the sitemap integration
// can omit them. We don't have access to astro:content here, so we read frontmatter
// directly with a minimal regex (no gray-matter dependency).
const draftProjectSlugs = new Set();
const projectsDir = 'src/content/projects';
if (fs.existsSync(projectsDir)) {
    for (const file of fs.readdirSync(projectsDir)) {
        if (!/\.(md|mdx)$/.test(file)) continue;
        const raw = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
        const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (fm && /^\s*draft:\s*true\s*$/m.test(fm[1])) {
            draftProjectSlugs.add(file.replace(/\.(md|mdx)$/, ''));
        }
    }
}

// https://astro.build/config
export default defineConfig({
    site: siteConfig.website,
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [
        mdx(),
        sitemap({
            filter: (page) => {
                for (const slug of draftProjectSlugs) {
                    if (page.includes(`/projects/${slug}/`) || page.includes(`/projects/${slug}`)) return false;
                }
                return true;
            }
        })
    ]
});

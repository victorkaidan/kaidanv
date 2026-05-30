import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import siteConfig from './src/data/site-config';

// Collect URL paths of draft entries at config-load time so the sitemap
// integration can omit them. We don't have access to astro:content here, so we
// read frontmatter directly with a minimal regex (no gray-matter dependency).
// Projects and Leadership share the same draft semantics and URL-from-slug
// mapping, so one scanner covers both.
function collectDraftPaths(dir, urlBase) {
    const paths = new Set();
    if (!fs.existsSync(dir)) return paths;
    for (const file of fs.readdirSync(dir)) {
        if (!/\.(md|mdx)$/.test(file)) continue;
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
        const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (fm && /^\s*draft:\s*true\s*$/m.test(fm[1])) {
            paths.add(`${urlBase}/${file.replace(/\.(md|mdx)$/, '')}`);
        }
    }
    return paths;
}

const draftPaths = new Set([
    ...collectDraftPaths('src/content/projects', '/projects'),
    ...collectDraftPaths('src/content/leadership', '/leadership')
]);

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
                for (const draftPath of draftPaths) {
                    if (page.includes(`${draftPath}/`) || page.includes(draftPath)) return false;
                }
                return true;
            }
        })
    ]
});

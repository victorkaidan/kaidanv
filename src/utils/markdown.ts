import { Marked } from 'marked';

// Shared markdown renderer for inline copy (hero/bio text in site-config).
// Opens external links and downloadable files (e.g. the CV PDF) in a new tab,
// while leaving internal anchors and mailto: links in the same tab.
export const markdown = new Marked({
    renderer: {
        link({ href, title, tokens }) {
            const text = this.parser.parseInline(tokens);
            const isNewTab = /^https?:\/\//.test(href) || href.endsWith('.pdf');
            const attrs = [
                `href="${href}"`,
                title ? `title="${title}"` : '',
                isNewTab ? 'target="_blank" rel="noopener noreferrer"' : ''
            ]
                .filter(Boolean)
                .join(' ');
            return `<a ${attrs}>${text}</a>`;
        }
    }
});

import { type CollectionEntry } from 'astro:content';
import { slugify } from './common-utils';

export function sortItemsByDateDesc(
    itemA: CollectionEntry<'blog' | 'projects' | 'leadership'>,
    itemB: CollectionEntry<'blog' | 'projects' | 'leadership'>
) {
    return new Date(itemB.data.publishDate).getTime() - new Date(itemA.data.publishDate).getTime();
}

// Reading order of the Leadership section, shared by the section index at the
// top of every Leadership page and the "Read next" link at the bottom. Pinned
// rather than date-sorted: the overview opens the section, design-with-ai
// states the general problem and the enable-and-constrain formula, shared-loop
// is the concrete operating model built on it, agentic looks outward at the
// product level. Entries not listed here sort after the pinned ones, date-desc.
const LEADERSHIP_ORDER = ['overview', 'design-with-ai', 'shared-loop', 'agentic'];

export function sortLeadershipSeries(entries: CollectionEntry<'leadership'>[]) {
    const rank = (id: string) => {
        const i = LEADERSHIP_ORDER.indexOf(id);
        return i === -1 ? Infinity : i;
    };
    return [...entries].sort((a, b) => rank(a.id) - rank(b.id) || sortItemsByDateDesc(a, b));
}

// Everything a Leadership page needs for its navigation: the ordered section
// index and the next entry to read. Drafts are hidden from the index unless the
// draft is the page itself (so a draft preview still shows where it sits). The
// last article points back to the first, so no page ends in a dead end.
export function getLeadershipNav(entries: CollectionEntry<'leadership'>[], currentId: string) {
    const series = sortLeadershipSeries(entries.filter((e) => !e.data.draft || e.id === currentId));
    const i = series.findIndex((e) => e.id === currentId);
    const next = series.length > 1 ? series[(i + 1) % series.length] : undefined;
    return { series, next };
}

// The overview is served by leadership/index.astro, everything else by [id].astro.
export function leadershipHref(id: string) {
    return id === 'overview' ? '/leadership/' : `/leadership/${id}/`;
}

export function getAllTags(posts: CollectionEntry<'blog'>[]) {
    const tags: string[] = [...new Set(posts.flatMap((post) => post.data.tags || []).filter(Boolean))];
    return tags
        .map((tag) => {
            return {
                name: tag,
                id: slugify(tag)
            };
        })
        .filter((obj, pos, arr) => {
            return arr.map((mapObj) => mapObj.id).indexOf(obj.id) === pos;
        });
}

export function getPostsByTag(posts: CollectionEntry<'blog'>[], tagId: string) {
    const filteredPosts: CollectionEntry<'blog'>[] = posts.filter((post) => (post.data.tags || []).map((tag) => slugify(tag)).includes(tagId));
    return filteredPosts;
}

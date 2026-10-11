export type Platform = "facebook" | "instagram" | "x" | "tiktok" | "linkedin" | "reddit" | "gumtree" | "other";
export type UrlStatus = "VERIFIED_ACTIONABLE" | "LOGIN_REQUIRED" | "GROUP_ACCESS_REQUIRED" | "INACCESSIBLE" | "DELETED" | "UNVERIFIED";

export type PermalinkInfo = { platform: Platform; canonicalUrl: string; nativeId?: string | undefined; isPostLevel: boolean; reason: string };

const strip = (u: URL) => {
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|igshid|ref|s$|t$|mibextid)/i.test(k)) u.searchParams.delete(k);
  u.hostname = u.hostname.replace(/^(www|m|mobile|web|mbasic)\./, "");
  return u;
};

export function analysePermalink(raw: string): PermalinkInfo {
  let u: URL;
  try { u = strip(new URL(raw)); } catch { return { platform: "other", canonicalUrl: raw, isPostLevel: false, reason: "not a URL" }; }
  const host = u.hostname;
  const p = u.pathname.replace(/\/+$/, "");
  const out = (platform: Platform, isPostLevel: boolean, reason: string, nativeId?: string): PermalinkInfo =>
    ({ platform, canonicalUrl: u.origin + p + (u.search || ""), nativeId, isPostLevel, reason });
  let m: RegExpMatchArray | null;
  if (/(^|\.)facebook\.com$/.test(host) || host === "fb.com") {
    if ((m = p.match(/\/groups\/[^/]+\/(?:posts|permalink)\/(\d+)/))) return out("facebook", true, "group post", m[1]);
    if ((m = p.match(/\/posts\/([\w-]+)/)) || (m = p.match(/\/permalink\.php/) && u.searchParams.get("story_fbid") ? [ "", u.searchParams.get("story_fbid")! ] : null)) return out("facebook", true, "page post", m[1]);
    if ((m = p.match(/\/(?:videos|reel)\/(\d+)/))) return out("facebook", true, "video/reel", m[1]);
    return out("facebook", false, "profile, group, search or share page, not a single post");
  }
  if (host === "x.com" || host === "twitter.com") {
    if ((m = p.match(/^\/[^/]+\/status\/(\d+)/))) { u.search = ""; return { platform: "x", canonicalUrl: `https://x.com${p.match(/^\/[^/]+\/status\/\d+/)![0]}`, nativeId: m[1], isPostLevel: true, reason: "status" }; }
    return out("x", false, "not a status URL");
  }
  if (host === "instagram.com") {
    if ((m = p.match(/^\/(?:[^/]+\/)?(?:p|reel|tv)\/([\w-]+)/))) { u.search = ""; return { platform: "instagram", canonicalUrl: `https://instagram.com/${p.match(/(p|reel|tv)\/[\w-]+/)![0]}`, nativeId: m[1], isPostLevel: true, reason: "post/reel" }; }
    return out("instagram", false, "profile, tag or search page");
  }
  if (host === "tiktok.com") {
    if ((m = p.match(/\/video\/(\d+)/))) { u.search = ""; return { platform: "tiktok", canonicalUrl: `https://tiktok.com${p}`, nativeId: m[1], isPostLevel: true, reason: "video" }; }
    return out("tiktok", false, "not a video URL");
  }
  if (host === "linkedin.com") {
    if ((m = p.match(/^\/posts\/[^/]+-(\d{10,}|[\w]+)-\w+$/)) || (m = p.match(/activity[-:](\d+)/))) { u.search = ""; return { platform: "linkedin", canonicalUrl: `https://linkedin.com${p}`, nativeId: m[1], isPostLevel: true, reason: "post" }; }
    return out("linkedin", false, "not a post URL");
  }
  if (host === "reddit.com" || host === "old.reddit.com") {
    if ((m = p.match(/\/comments\/(\w+)/))) { u.search = ""; return { platform: "reddit", canonicalUrl: `https://reddit.com${p}`, nativeId: m[1], isPostLevel: true, reason: "thread" }; }
    return out("reddit", false, "subreddit or search page");
  }
  if (host === "gumtree.co.za") {
    if ((m = p.match(/\/a-[\w-]+\/[\w-]+\/(\d{6,})$/))) { u.search = ""; return { platform: "gumtree", canonicalUrl: `https://gumtree.co.za${p}`, nativeId: m[1], isPostLevel: true, reason: "ad" }; }
    return out("gumtree", false, "listing/search page");
  }
  return out("other", false, "unsupported platform");
}

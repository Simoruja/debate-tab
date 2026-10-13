// Vercel build step for the Leaves Away site: `node fetch-photos.mjs`.
//
// Copies the site into dist/, downloads the photos it uses from Wikimedia
// Commons, and writes each photographer's credit and license into the page
// footer (Creative Commons licenses require that credit).
//
// If any photo can't be downloaded, the build fails so the live site never
// goes out with a missing picture. The exit code says which photo failed
// (10 x its number in PHOTOS, plus 1 for the API lookup or 2 for the download),
// since Vercel shows the exit code even when the build log isn't handy.
//
// To swap a photo, find one on commons.wikimedia.org and put its exact file
// name (without "File:") below.
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const PHOTOS = [
  { name: "rake", file: "Leaf rake and leaves.jpg", width: 1920 },
  { name: "raking", file: "Fan-shaped leaf rake.jpg", width: 960 },
  { name: "leaf-pile", file: "Autumn Leaves (22498001985).jpg", width: 1920 },
  { name: "snow", file: "Shoveling snow, Seattle, 1923.jpg", width: 1920 },
];

// Wikimedia asks automated clients to identify themselves.
const HEADERS = { "User-Agent": "LeavesAwaySiteBuild/1.0 (https://leavesaway.vercel.app)" };
const SITE_FILES = ["index.html", "styles.css", "config.js", "app.js"];

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

function plainText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function lookUp(photo, number) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: `File:${photo.file}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(photo.width),
  }).toString();
  const res = await fetch(api, { headers: HEADERS });
  if (!res.ok) fail(number * 10 + 1, `Commons lookup for "${photo.file}" failed: HTTP ${res.status}`);
  const page = (await res.json())?.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info) fail(number * 10 + 1, `"${photo.file}" was not found on Wikimedia Commons.`);
  const meta = info.extmetadata || {};
  return {
    url: info.thumburl || info.url,
    pageUrl: info.descriptionurl,
    artist: plainText(meta.Artist?.value) || "Unknown photographer",
    license: plainText(meta.LicenseShortName?.value) || "see file page",
  };
}

async function download(photo, number, url) {
  const res = await fetch(url, { headers: HEADERS });
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) {
    fail(number * 10 + 2, `Download of "${photo.file}" failed: HTTP ${res.status}, ${type}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 20000) fail(number * 10 + 2, `"${photo.file}" is only ${bytes.length} bytes.`);
  await writeFile(`dist/img/${photo.name}.jpg`, bytes);
  console.log(`Downloaded ${photo.name}.jpg (${bytes.length} bytes) from ${url}`);
}

await rm("dist", { recursive: true, force: true });
await mkdir("dist/img", { recursive: true });
for (const file of SITE_FILES) await cp(file, `dist/${file}`);

const credits = [];
for (const [index, photo] of PHOTOS.entries()) {
  const number = index + 1;
  const info = await lookUp(photo, number);
  await download(photo, number, info.url);
  credits.push(
    `<a href="${escapeHtml(info.pageUrl)}" rel="noopener">${escapeHtml(info.artist)}</a> (${escapeHtml(info.license)})`
  );
}

const html = await readFile("dist/index.html", "utf8");
const marker = /<!-- photo-credits -->[\s\S]*?<!-- \/photo-credits -->/;
if (!marker.test(html)) fail(1, "index.html is missing the photo-credits markers.");
await writeFile(
  "dist/index.html",
  html.replace(marker, `Photos from Wikimedia Commons by ${credits.join(", ")}.`)
);
console.log("Photo credits written to index.html");

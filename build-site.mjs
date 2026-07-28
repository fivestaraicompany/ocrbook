import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL(".", import.meta.url);
const dist = new URL("./dist/", root);
const client = new URL("./dist/client/", root);
const server = new URL("./dist/server/", root);

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });

const files = [
  "index.html",
  "privacy.html",
  "i18n.js",
  "lang-selector.css",
  "lang-selector.js"
];
const directories = ["assets", "i18n", "tutorial"];

await Promise.all(
  files.map((file) => cp(new URL(file, root), new URL(file, client)))
);
await Promise.all(
  directories.map((directory) =>
    cp(new URL(`${directory}/`, root), new URL(`${directory}/`, client), {
      recursive: true,
      filter: (source) => !source.endsWith(".DS_Store")
    })
  )
);

const worker = [
  "export default {",
  "  async fetch(request, env) {",
  "    return env.ASSETS.fetch(request);",
  "  }",
  "};",
  ""
].join("\n");

await writeFile(join(server.pathname, "index.js"), worker, "utf8");

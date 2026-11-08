// Developer tool: renders an area to .preview/<area>.png with the game's bake, sprites and lighting (no browser).
// node scripts/areaPreview.mjs <area> [x y w h scale] [flat]
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
execFileSync("node_modules/.bin/esbuild", ["tests/support/areaPreview.ts", "--bundle", "--platform=node", "--format=cjs", "--outfile=.preview/area.cjs", "--log-level=warning"], { stdio: "inherit" });
const run = createRequire(import.meta.url)("../.preview/area.cjs");
const [area = "town", x = "0", y = "0", w = "0", h = "0", scale = "1", flat] = process.argv.slice(2);
const name = `.preview/${area}${x !== "0" || y !== "0" ? `_${x}_${y}` : ""}${flat ? "_flat" : ""}.png`;
run.render(area, name, +x, +y, +w, +h, +scale, !flat);
console.log("wrote", name);

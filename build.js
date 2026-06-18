const { execSync } = require("node:child_process");
const path = require("node:path");

const input = process.argv[2] || "models/camera.js";
const dir = path.dirname(input);
const base = path.basename(input, path.extname(input));
const output = path.join(dir, `${base}.jscad.json`);

execSync(`npx @jscad/cli "${input}" -o "${output}"`, { stdio: "inherit" });

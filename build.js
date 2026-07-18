const { execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const { resolveCamModel } = require("./camera-model");

const camModel = resolveCamModel(process.argv[2], { command: "build" });
const input = process.argv[3] || "models/camera.js";
const base = path.basename(input, path.extname(input));

const jscadDir = path.join(__dirname, "jscad");
const stlDir = path.join(__dirname, "stl");

if (!fs.existsSync(jscadDir)) {
  fs.mkdirSync(jscadDir, { recursive: true });
}

if (!fs.existsSync(stlDir)) {
  fs.mkdirSync(stlDir, { recursive: true });
}

const jscadOutput = path.join(jscadDir, `${base}.${camModel}.jscad.json`);
const stlOutput = path.join(stlDir, `${base}_${camModel}.stl`);

console.log(`[build] CAM_MODEL=${camModel}`);
execSync(`npx @jscad/cli "${input}" -o "${jscadOutput}"`, {
  stdio: "inherit",
  env: process.env,
});
// execSync(`npx @jscad/cli "${input}" -o "${stlOutput}"`, { stdio: "inherit", env: process.env });

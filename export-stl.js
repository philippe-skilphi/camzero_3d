const { execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const { resolveCamModel } = require("./camera-model");

const camModel = resolveCamModel(process.argv[2], { command: "export:stl" });
const input = process.argv[3] || "models/camera.js";
const base = path.basename(input, path.extname(input));

const stlDir = path.join(__dirname, "stl");
if (!fs.existsSync(stlDir)) {
  fs.mkdirSync(stlDir, { recursive: true });
}

const shortSha = execSync("git rev-parse --short HEAD", {
  encoding: "utf8",
}).trim();
const stlOutput = path.join(stlDir, `${base}_${camModel}_${shortSha}.stl`);

process.env.SEG = process.env.SEG || "128";

console.log(`[export:stl] CAM_MODEL=${camModel} SEG=${process.env.SEG}`);
console.log(`[export:stl] Writing ${stlOutput}`);
execSync(`npx @jscad/cli "${input}" -o "${stlOutput}"`, {
  stdio: "inherit",
  env: process.env,
});

const { watch } = require("node:fs");
const { execSync } = require("node:child_process");

const file = process.argv[2] || "models/backplate.js";
const dependencyFiles = [
  "models/rope.js",
  "models/camera-hole.js",
  "models/screwery.js",
  "models/raspberryzero-mount.js",
  "models/power-converter-mount.js",
];
const filesToWatch = [file, ...dependencyFiles.filter((f) => f !== file)];
let debounce = null;

function build(changedFile = file) {
  console.log(`\n[watch] ${changedFile} changed — rebuilding ${file}...`);
  try {
    execSync(`node build.js "${file}"`, { stdio: "inherit" });
    console.log("[watch] Done. Waiting for changes...");
  } catch {
    console.error("[watch] Build failed.");
  }
}

build();

for (const watchedFile of filesToWatch) {
  watch(watchedFile, () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => build(watchedFile), 200);
  });
}

const { watch } = require("node:fs");
const { execSync } = require("node:child_process");
const path = require("node:path");

const file = process.argv[2] || "models/camera.js";
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

watch("models", { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.js')) {
    clearTimeout(debounce);
    debounce = setTimeout(() => build(path.join("models", filename)), 200);
  }
});

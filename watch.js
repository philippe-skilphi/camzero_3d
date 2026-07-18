const { watch } = require("node:fs");
const { execSync } = require("node:child_process");
const path = require("node:path");
const { resolveCamModel } = require("./camera-model");

const camModel = resolveCamModel(process.argv[2], { command: "watch" });
const file = process.argv[3] || "models/camera.js";
let debounce = null;

function build(changedFile = file) {
  console.log(
    `\n[watch] CAM_MODEL=${camModel} — ${changedFile} changed — rebuilding ${file}...`,
  );
  try {
    execSync(`node build.js "${camModel}" "${file}"`, {
      stdio: "inherit",
      env: process.env,
    });
    console.log("[watch] Done. Waiting for changes...");
  } catch {
    console.error("[watch] Build failed.");
  }
}

console.log(`[watch] CAM_MODEL=${camModel}`);
build();

watch("models", { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith(".js")) {
    clearTimeout(debounce);
    debounce = setTimeout(() => build(path.join("models", filename)), 200);
  }
});

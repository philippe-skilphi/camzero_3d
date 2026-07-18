const VALID_CAM_MODELS = ["tangxi", "sainsmart"];

function usageMessage(command = "build") {
  return [
    `Missing or invalid camera model.`,
    `Usage: npm run ${command} -- <tangxi|sainsmart> [entry-file]`,
    `Example: npm run ${command} -- tangxi`,
    `Example: npm run export:stl -- sainsmart`,
  ].join("\n");
}

/**
 * Validate and return a camera model name.
 * @param {string | undefined} raw
 * @param {{ command?: string, setEnv?: boolean }} [options]
 */
function resolveCamModel(raw, { command = "build", setEnv = true } = {}) {
  const model = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!VALID_CAM_MODELS.includes(model)) {
    throw new Error(usageMessage(command));
  }
  if (setEnv) {
    process.env.CAM_MODEL = model;
  }
  return model;
}

/**
 * Read CAM_MODEL from the environment (for geometry modules loaded by JSCAD).
 * Fails fast when unset or invalid.
 */
function requireCamModelFromEnv() {
  return resolveCamModel(process.env.CAM_MODEL, {
    command: "build",
    setEnv: false,
  });
}

module.exports = {
  VALID_CAM_MODELS,
  resolveCamModel,
  requireCamModelFromEnv,
  usageMessage,
};

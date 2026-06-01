import path from "path";

// Resolved from runtime/, so PACKAGE_ROOT is the e2e/maestro package root.
export const PACKAGE_ROOT = path.resolve(__dirname, "..");
export const USERDATA_DIR = path.join(PACKAGE_ROOT, "userdata");
export const ARTIFACTS_DIR = path.join(PACKAGE_ROOT, "artifacts");

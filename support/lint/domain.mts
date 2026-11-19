import { defineConfig } from "oxlint";
import base from "./base.mts";

export default defineConfig({
  extends: [base],
  rules: {
    "storage/no-engine-import": "error",
    "storage/no-port-import": "error",
  },
});

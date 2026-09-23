// Layer config. oxlint finds it by walking up from any package below, which is also how
// the editor extension resolves rules, so what you see while typing is what CI runs.
// The content lives in the support/ preset; this file only names it.
export { default } from "@support/lint-domain/oxlint.config";

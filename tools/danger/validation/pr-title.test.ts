import { expect, it } from "@jest/globals";
import { isValidPrTitle } from "./pr-title";
import { COMMIT_TYPES } from "../../../commitlint.types.js";

it("expects this structure '<type>(<scope>): <description>'", () => {
  expect(isValidPrTitle("feat(ui): add dark mode toggle")).toBe(true);
});

it("accepts title with a Jira ticket", () => {
  expect(isValidPrTitle("feat(ui): add dark mode  (ABC-1234)")).toBe(true);
});

it("accepts a breaking change title", () => {
  expect(isValidPrTitle("feat(ui)!: drop node 18")).toBe(true);
});

it("accepts our expected commit types", () => {
  COMMIT_TYPES.forEach((type: string) => {
    expect(isValidPrTitle(`${type}(desktop): update something`)).toBe(true);
  });
});

it("rejects a title without a scope", () => {
  expect(isValidPrTitle("feat: add dark mode toggle")).toBe(false);
});

it("rejects an unknown type", () => {
  expect(isValidPrTitle("feature(ui): add dark mode toggle")).toBe(false);
});

it("rejects a title missing the colon and space after the scope", () => {
  expect(isValidPrTitle("feat(ui) add dark mode toggle")).toBe(false);
});

it("accepts a title with a valid prefix", () => {
  expect(isValidPrTitle("[LWD] feat(ui): change (LIVE-1234)")).toBe(true);
  expect(isValidPrTitle("[LWDM] feat(ui): change (LIVE-1234)")).toBe(true);
  expect(isValidPrTitle("[LWM] feat(ui): change (LIVE-1234)")).toBe(true);
});

it("rejects a title with an invalid prefix", () => {
  expect(isValidPrTitle("[FOO] feat(ui): change (LIVE-1234)")).toBe(false);
});

it("rejects a title with a ticket suffix that is not in the format of ABC-123", () => {
  expect(isValidPrTitle("feat(ui): change (BAD-ID)")).toBe(false);
});

it("accepts a title with a dash in the scope", () => {
  expect(isValidPrTitle("feat(foo-bar): make a change")).toBe(true);
});

it("rejects a title with a dash trailing the scope", () => {
  expect(isValidPrTitle("feat(foo-): make a change")).toBe(false);
});

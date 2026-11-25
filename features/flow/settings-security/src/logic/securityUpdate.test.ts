import type { SecuritySideEffects } from "../ports";
import { applySecurityUpdate, isSecurityUpdate } from "./securityUpdate";

const createEffects = () =>
  ({
    setHideBalance: jest.fn(),
    setMevProtection: jest.fn(),
    setAutoLockTimeout: jest.fn(),
  }) satisfies SecuritySideEffects;

describe("applySecurityUpdate", () => {
  it("hides the balance and nothing else", () => {
    const effects = createEffects();

    applySecurityUpdate(effects, { key: "hideBalance", value: true });

    expect(effects.setHideBalance.mock.calls).toEqual([[true]]);
    expect(effects.setMevProtection).not.toHaveBeenCalled();
    expect(effects.setAutoLockTimeout).not.toHaveBeenCalled();
  });

  it("changes the MEV protection and nothing else", () => {
    const effects = createEffects();

    applySecurityUpdate(effects, { key: "mevProtection", value: false });

    expect(effects.setMevProtection.mock.calls).toEqual([[false]]);
    expect(effects.setHideBalance).not.toHaveBeenCalled();
    expect(effects.setAutoLockTimeout).not.toHaveBeenCalled();
  });

  it("changes the auto-lock timeout and nothing else", () => {
    const effects = createEffects();

    applySecurityUpdate(effects, { key: "autoLockTimeout", value: 30 });

    expect(effects.setAutoLockTimeout.mock.calls).toEqual([[30]]);
    expect(effects.setHideBalance).not.toHaveBeenCalled();
    expect(effects.setMevProtection).not.toHaveBeenCalled();
  });
});

describe("isSecurityUpdate", () => {
  it("recognizes the changes of the Security section", () => {
    expect(isSecurityUpdate({ key: "hideBalance" })).toBe(true);
    expect(isSecurityUpdate({ key: "mevProtection" })).toBe(true);
    expect(isSecurityUpdate({ key: "autoLockTimeout" })).toBe(true);
  });

  it("leaves the changes of the other sections", () => {
    expect(isSecurityUpdate({ key: "theme" })).toBe(false);
  });
});

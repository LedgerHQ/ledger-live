import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBlockingDialog, parseScreenState } from "./android.ts";

describe("parseScreenState", () => {
  it("reads an awake screen with the app in focus", () => {
    const dumpsys =
      "  mWakefulness=Awake\n  mCurrentFocus=Window{8d1c2f u0 com.ledger.live/com.ledger.live.MainActivity}\n";
    assert.deepEqual(parseScreenState(dumpsys), {
      wakefulness: "Awake",
      focus: "com.ledger.live/com.ledger.live.MainActivity",
      keyguard: false,
    });
  });
  it("sees the keyguard through the notification shade", () => {
    const dumpsys = "  mWakefulness=Awake\n  mCurrentFocus=Window{51a u0 NotificationShade}\n";
    assert.equal(parseScreenState(dumpsys).keyguard, true);
  });
  it("reads a screen that is off and has no focused window", () => {
    assert.deepEqual(parseScreenState("  mWakefulness=Asleep\n"), {
      wakefulness: "Asleep",
      focus: null,
      keyguard: false,
    });
  });
});

describe("parseBlockingDialog", () => {
  it("names the package of an ANR dialog", () => {
    const dumpsys =
      "  mCurrentFocus=Window{3e1 u0 Application Not Responding: com.android.systemui}\n";
    assert.equal(parseBlockingDialog(dumpsys), "com.android.systemui");
  });
  it("names the package of a crash dialog", () => {
    const dumpsys = "  mCurrentFocus=Window{3e1 u0 Application Error: com.google.android.gms}\n";
    assert.equal(parseBlockingDialog(dumpsys), "com.google.android.gms");
  });
  it("is null when the app has the focus", () => {
    const dumpsys = "  mCurrentFocus=Window{8d1 u0 com.ledger.live/com.ledger.live.MainActivity}\n";
    assert.equal(parseBlockingDialog(dumpsys), null);
  });
});

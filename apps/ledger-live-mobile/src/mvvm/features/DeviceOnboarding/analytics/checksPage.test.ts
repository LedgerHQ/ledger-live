import { deviceOnboardingMachine } from "@features/platform-device-onboarding";
import { onboardingPages } from "@features/platform-device-onboarding-analytics";
import { checksPage } from "./checksPage";

/** Checks states that show no page of their own: the screen stays on the page before. */
const statesWithoutPage = new Set([
  "checks.enteringEarlyCheckScreen",
  "checks.genuineFailurePending",
  "checks.firmwareFailurePending",
  "checks.firmwareUpdateDelegated",
]);

type StateNodeTree = Readonly<{ key: string; states: Readonly<Record<string, StateNodeTree>> }>;

function leafStates(node: StateNodeTree, path: string): string[] {
  const children = Object.values(node.states);
  if (children.length === 0) return [path];
  return children.flatMap(child => leafStates(child, `${path}.${child.key}`));
}

const checksStates = leafStates(deviceOnboardingMachine.root.states.checks, "checks");

describe("checksPage", () => {
  it.each([
    ["awaitingStart", false, null, onboardingPages.genuineCheck],
    ["checks.checksIdle", true, null, onboardingPages.genuineCheck],
    ["checks.checksIdle", false, null, null],
    ["checks.genuineCheck.running", false, null, onboardingPages.genuineCheckStarted],
    ["checks.genuineCheck.awaitingApproval", false, null, onboardingPages.genuineCheckStarted],
    ["checks.genuineFailed", false, "GENUINE_CHECK_REFUSED", onboardingPages.genuineCheckRefused],
    ["checks.notGenuineSupport", false, "DEVICE_NOT_GENUINE", onboardingPages.genuineCheckError],
    ["checks.genuineFailed", false, "GENUINE_CHECK_FAILED", onboardingPages.genuineCheckError],
    ["checks.genuineFailed", false, "SECURE_CHANNEL_LOST", onboardingPages.genuineCheckError],
    ["checks.firmwareCheckFailed", false, null, onboardingPages.genuineCheckError],
    ["checks.firmwareCheck", false, null, onboardingPages.checkOsVersion],
    ["checks.firmwareUpdateOffered", false, null, onboardingPages.osUpdateRequired],
    ["checks.checksSucceeded", false, null, onboardingPages.checksSuccess],
    ["checks.checksDone", false, null, onboardingPages.checksSuccess],
    ["checks.leavingEarlyCheckScreen", false, null, onboardingPages.checksSuccess],
    ["syncOffer", false, null, onboardingPages.checksSuccess],
    ["done", false, null, onboardingPages.checksSuccess],
    ["checks.firmwareUpdateDelegated", false, null, null],
    ["checks.enteringEarlyCheckScreen", false, null, null],
    ["deviceLocked", false, null, null],
    [null, false, null, null],
  ] as const)("should map %s to its page", (state, paused, failureKind, page) => {
    expect(checksPage(state, paused, failureKind)).toBe(page);
  });

  // A renamed or new checks state must get a page here, or join `statesWithoutPage` on purpose.
  it.each(checksStates.filter(state => !statesWithoutPage.has(state)))(
    "should give the machine state %s a page",
    state => {
      expect(checksPage(state, true, "GENUINE_CHECK_FAILED")).not.toBeNull();
    },
  );

  it.each([...statesWithoutPage])("should still find %s in the machine", state => {
    expect(checksStates).toContain(state);
  });
});

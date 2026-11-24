import { deviceOnboardingMachine } from "@features/platform-device-onboarding";
import { seededPages } from "@features/platform-device-onboarding-analytics";
import { seededChecksPage } from "./seededChecksPage";

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

describe("seededChecksPage", () => {
  it.each([
    ["awaitingStart", false, null, seededPages.genuineCheck],
    ["checks.checksIdle", true, null, seededPages.genuineCheck],
    ["checks.checksIdle", false, null, null],
    ["checks.genuineCheck.running", false, null, seededPages.genuineCheckStarted],
    ["checks.genuineCheck.awaitingApproval", false, null, seededPages.genuineCheckStarted],
    ["checks.genuineFailed", false, "GENUINE_CHECK_REFUSED", seededPages.genuineCheckRefused],
    ["checks.notGenuineSupport", false, "DEVICE_NOT_GENUINE", seededPages.genuineCheckError],
    ["checks.genuineFailed", false, "GENUINE_CHECK_FAILED", seededPages.genuineCheckError],
    ["checks.genuineFailed", false, "SECURE_CHANNEL_LOST", seededPages.genuineCheckError],
    ["checks.firmwareCheckFailed", false, null, seededPages.genuineCheckError],
    ["checks.firmwareCheck", false, null, seededPages.checkOsVersion],
    ["checks.firmwareUpdateOffered", false, null, seededPages.osUpdateRequired],
    ["checks.checksSucceeded", false, null, seededPages.checksSuccess],
    ["checks.checksDone", false, null, seededPages.checksSuccess],
    ["checks.leavingEarlyCheckScreen", false, null, seededPages.checksSuccess],
    ["syncOffer", false, null, seededPages.checksSuccess],
    ["done", false, null, seededPages.checksSuccess],
    ["checks.firmwareUpdateDelegated", false, null, null],
    ["checks.enteringEarlyCheckScreen", false, null, null],
    ["deviceLocked", false, null, null],
    [null, false, null, null],
  ] as const)("should map %s to its page", (state, paused, failureKind, page) => {
    expect(seededChecksPage(state, paused, failureKind)).toBe(page);
  });

  // A renamed or new checks state must get a page here, or join `statesWithoutPage` on purpose.
  it.each(checksStates.filter(state => !statesWithoutPage.has(state)))(
    "should give the machine state %s a page",
    state => {
      expect(seededChecksPage(state, true, "GENUINE_CHECK_FAILED")).not.toBeNull();
    },
  );

  it.each([...statesWithoutPage])("should still find %s in the machine", state => {
    expect(checksStates).toContain(state);
  });
});

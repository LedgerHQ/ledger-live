/**
 * @jest-environment jsdom
 */
import { act, waitFor } from "@testing-library/react";
import { selectIsKeyRingMember, selectKeyRingTreeId } from "@domain/entity-key-ring";
import {
  KeyRingError,
  KeyRingMemberRemovedError,
  KeyRingNotAllowedError,
  KeyRingOutdatedError,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { LedgerSyncErrorMessage } from "../logic/errors";
import type { LedgerSyncErrorRecoveryOptions } from "../types";
import { listenToAnalytics, stopAnalytics } from "../__tests__/analytics";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncErrorRecovery } from "./useLedgerSyncErrorRecovery";

const DESKTOP_MESSAGES = [LedgerSyncErrorMessage.noTrustchain];
const MOBILE_MESSAGES = [
  LedgerSyncErrorMessage.noTrustchain,
  LedgerSyncErrorMessage.membersDataUndefined,
];
const RESET = "trustchain/keyRingReset";

function renderRecovery(options: Partial<LedgerSyncErrorRecoveryOptions> = {}) {
  const sequence: string[] = [];
  listenToAnalytics(sequence);
  const client = fakeKeyRingClient({
    invalidateAuth: jest.fn(() => {
      sequence.push("invalidateAuth");
    }),
    restore: jest.fn().mockResolvedValue(newTreeUpdate("restored-root")),
  });
  const onReset = jest.fn(() => {
    sequence.push("onReset");
  });
  const rendered = renderLedgerSyncHook(
    () =>
      useLedgerSyncErrorRecovery({
        client,
        onReset,
        resetOnMessages: DESKTOP_MESSAGES,
        ...options,
      }),
    { sequence },
  );
  sequence.length = 0;
  return { ...rendered, client, onReset, sequence };
}

afterEach(stopAnalytics);

describe("useLedgerSyncErrorRecovery", () => {
  it.each([
    ["member-removed", new KeyRingMemberRemovedError()],
    ["not-allowed", new KeyRingNotAllowedError()],
  ])("should reset, track, call onReset then drop the token on a %s error", (_category, error) => {
    const { result, sequence, store } = renderRecovery();

    act(() => result.current.handleError(error));

    expect(sequence).toEqual([RESET, "track", "onReset", "invalidateAuth"]);
    expect(selectIsKeyRingMember(store.getState())).toBe(false);
  });

  it("should restore the key tree on an outdated error without resetting", async () => {
    const { result, client, sequence, store } = renderRecovery();

    act(() => result.current.handleError(new KeyRingOutdatedError()));

    await waitFor(() => expect(selectKeyRingTreeId(store.getState())).toBe("restored-root"));
    expect(client.restore).toHaveBeenCalledTimes(1);
    expect(sequence).not.toContain(RESET);
  });

  it("should ignore an error it does not recover from", () => {
    const { result, sequence, onReset } = renderRecovery();

    act(() => result.current.handleError(new KeyRingError("network", "offline")));

    expect(sequence).toEqual([]);
    expect(onReset).not.toHaveBeenCalled();
  });

  it("should reset on a message the app lists", () => {
    const { result, onReset } = renderRecovery();

    act(() =>
      result.current.handleError(new Error(`Error: ${LedgerSyncErrorMessage.noTrustchain}`)),
    );

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["desktop", DESKTOP_MESSAGES, 0],
    ["mobile", MOBILE_MESSAGES, 1],
  ])(
    "should reset on the members data undefined error only with the %s messages",
    (_app, resetOnMessages, resets) => {
      const { result, onReset } = renderRecovery({ resetOnMessages });

      act(() => result.current.handleError(new Error(LedgerSyncErrorMessage.membersDataUndefined)));

      expect(onReset).toHaveBeenCalledTimes(resets);
    },
  );

  it("should reset twice on an error matching both a category and a message", () => {
    const { result, onReset } = renderRecovery();

    act(() =>
      result.current.handleError(
        new KeyRingMemberRemovedError(LedgerSyncErrorMessage.noTrustchain),
      ),
    );

    expect(onReset).toHaveBeenCalledTimes(2);
  });

  it("should log the error before anything else when the app logs", () => {
    const sequenceRef: { current: string[] } = { current: [] };
    const logError = jest.fn(() => {
      sequenceRef.current.push("logError");
    });
    const { result, sequence } = renderRecovery({ logError });
    sequenceRef.current = sequence;
    const error = new KeyRingMemberRemovedError();

    act(() => result.current.handleError(error));

    expect(logError).toHaveBeenCalledWith(error);
    expect(sequence[0]).toBe("logError");
  });
});

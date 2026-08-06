import { act, renderHook } from "@testing-library/react";
import { ContactIdSchema } from "@domain/entity-contact";
import {
  type ContactsLedgerSyncMutationIntent,
  useContactsLedgerSyncMutationGuard,
} from "./useContactsLedgerSyncMutationGuard";

describe("useContactsLedgerSyncMutationGuard", () => {
  it("allows a mutation only when Ledger Sync is ready", () => {
    const { result } = renderHook(() => useContactsLedgerSyncMutationGuard());

    expect(result.current.requestMutation({ kind: "addContact" }, "ready")).toEqual({
      status: "allowed",
      intent: { kind: "addContact" },
    });
    expect(result.current.pendingIntent).toBeUndefined();
  });

  it("blocks while Ledger Sync is checking without opening an intent", () => {
    const { result } = renderHook(() => useContactsLedgerSyncMutationGuard());

    expect(result.current.requestMutation({ kind: "addContact" }, "checking")).toEqual({
      status: "checking",
    });
    expect(result.current.pendingIntent).toBeUndefined();
  });

  it("preserves an address intent until activation succeeds", () => {
    const { result } = renderHook(() => useContactsLedgerSyncMutationGuard());
    const contactId = ContactIdSchema.parse("contact-ben");

    act(() => {
      expect(result.current.requestMutation({ kind: "addAddress", contactId }, "inactive")).toEqual(
        {
          status: "blocked",
          intent: { kind: "addAddress", contactId },
        },
      );
    });

    expect(result.current.pendingIntent).toEqual({ kind: "addAddress", contactId });
    expect(result.current.consumePendingIntent("inactive")).toBeUndefined();

    let resumed: ContactsLedgerSyncMutationIntent | undefined;
    act(() => {
      resumed = result.current.consumePendingIntent("ready");
    });

    expect(resumed).toEqual({ kind: "addAddress", contactId });
    expect(result.current.pendingIntent).toBeUndefined();
  });

  it("clears a pending intent when activation is dismissed", () => {
    const { result } = renderHook(() => useContactsLedgerSyncMutationGuard());

    act(() => {
      result.current.requestMutation({ kind: "addContact" }, "inactive");
    });
    act(() => {
      result.current.dismissPendingIntent();
    });

    expect(result.current.pendingIntent).toBeUndefined();
    expect(result.current.consumePendingIntent("ready")).toBeUndefined();
  });
});

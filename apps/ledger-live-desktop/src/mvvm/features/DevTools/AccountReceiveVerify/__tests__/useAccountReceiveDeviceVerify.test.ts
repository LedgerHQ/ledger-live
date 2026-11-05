import { act, renderHook, waitFor } from "@testing-library/react";
import { AddressSchema } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountReceiveVerifyRequest } from "@devtools/bindings";
import { useAccountReceiveDeviceVerify } from "../useAccountReceiveDeviceVerify";

const descriptor = mockAddressAccountDescriptor();
const address = AddressSchema.parse("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");

const shown: AccountReceiveVerifyRequest = {
  key: "shown",
  descriptor,
  verification: { type: "address", path: "m/44h/60h/0h/0/0", address },
  target: "receive",
};

const key: AccountReceiveVerifyRequest = {
  key: "key",
  descriptor,
  verification: { type: "publicKey", path: "m/44h/3030h", publicKey: "302a" },
  target: "receive",
};

describe("useAccountReceiveDeviceVerify", () => {
  it("runs a verification the device can show, until its outcome", async () => {
    const { result } = renderHook(() => useAccountReceiveDeviceVerify());
    act(() => result.current.deviceVerify.verify(shown));
    expect(result.current.deviceVerify.outcomes.shown).toBe("preparing…");
    await waitFor(() => expect(result.current.execution?.key).toBe("shown"));
    expect(result.current.deviceVerify.outcomes.shown).toBe("verifying on device…");
    expect(result.current.execution?.plan.input.expectedAddress).toBe(address);

    act(() => result.current.execution?.onOutcome("verified on device"));
    expect(result.current.execution).toBeNull();
    expect(result.current.deviceVerify.outcomes.shown).toBe("verified on device");
  });

  it("says why a verification cannot run, without starting the device", async () => {
    const { result } = renderHook(() => useAccountReceiveDeviceVerify());
    act(() => result.current.deviceVerify.verify(key));
    await waitFor(() => expect(result.current.deviceVerify.outcomes.key).toMatch(/^unsupported: /));
    expect(result.current.execution).toBeNull();
  });

  it("refuses a second verification while one runs, then accepts the next", async () => {
    const { result } = renderHook(() => useAccountReceiveDeviceVerify());
    act(() => {
      result.current.deviceVerify.verify(shown);
      result.current.deviceVerify.verify(shown);
      result.current.deviceVerify.verify(key);
    });
    expect(result.current.deviceVerify.outcomes.key).toBe(
      "refused: another verification is running",
    );
    await waitFor(() => expect(result.current.execution?.key).toBe("shown"));
    const first = result.current.execution;

    act(() => result.current.deviceVerify.verify(shown));
    expect(result.current.execution).toBe(first);

    act(() => result.current.execution?.onOutcome("cancelled on device"));
    act(() => result.current.deviceVerify.verify(key));
    await waitFor(() => expect(result.current.deviceVerify.outcomes.key).toMatch(/^unsupported: /));
  });
});

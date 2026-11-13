import { waitFor } from "@testing-library/react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { VerifyAddressDeviceState } from "@features/platform-intent-verify-address";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { NEVER } from "rxjs";
import { buildVerifyAddressIntentInput } from "../buildVerifyAddressIntentInput";

function connectionToUnresponsiveDevice() {
  const silentLogger = { debug() {}, info() {}, warn() {}, error() {} };
  const dmk = {
    sendApdu: jest.fn(() => new Promise<never>(() => {})),
    executeDeviceAction: jest.fn(() => ({ observable: NEVER, cancel: () => {} })),
    getLoggerFactory: () => () => silentLogger,
  };
  const connection = { dmk, sessionId: "session-1" } as unknown as DeviceConnectionResult;

  return { connection, dmk };
}

function startVerification(currencyId: string) {
  const account = genAccount(`verify-${currencyId}`, {
    currency: getCryptoCurrencyById(currencyId),
  });
  const { connection, dmk } = connectionToUnresponsiveDevice();
  const states: VerifyAddressDeviceState[] = [];
  const { observable } =
    buildVerifyAddressIntentInput(account).startAddressVerification(connection);
  const subscription = observable.subscribe(state => states.push(state));

  return { dmk, states, subscription };
}

describe("buildVerifyAddressIntentInput", () => {
  it("should use the canton party id when freshAddress is empty", () => {
    const canton = getCryptoCurrencyById("canton_network");
    const account = {
      ...genAccount("verify-canton", { currency: canton }),
      derivationMode: "canton" as const,
      freshAddress: "",
      xpub: "canton-party-id",
    };

    expect(buildVerifyAddressIntentInput(account).expectedAddress).toBe("canton-party-id");
  });

  it("should report awaiting-confirmation only once the first APDU is sent by a legacy signer", async () => {
    const { dmk, states, subscription } = startVerification("algorand");
    expect(states).toEqual([]);

    await waitFor(() => expect(dmk.sendApdu).toHaveBeenCalled());
    expect(states).toEqual([{ type: "awaiting-confirmation" }]);
    subscription.unsubscribe();
  });

  it("should report awaiting-confirmation only once a DMK signer starts its device action", async () => {
    const { dmk, states, subscription } = startVerification("ethereum");
    expect(states).toEqual([]);

    await waitFor(() => expect(dmk.executeDeviceAction).toHaveBeenCalled());
    expect(states).toEqual([{ type: "awaiting-confirmation" }]);
    subscription.unsubscribe();
  });
});

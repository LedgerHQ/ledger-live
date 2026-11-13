import { waitFor } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { VerifyAddressDeviceState } from "@features/platform-intent-verify-address";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { NEVER } from "rxjs";
import { buildVerifyAddressIntentInput } from "../buildVerifyAddressIntentInput";

jest.mock("@ledgerhq/live-common/hw/getAddress/index", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockGetAddress = jest.mocked(getAddress);

const ethereum = genAccount("receive-verify-ethereum", {
  currency: getCryptoCurrencyById("ethereum"),
});
const ADDRESS = ethereum.freshAddress;
const PATH = "m/44h/60h/0h/0/0";

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

function verifyOnDevice(account = ethereum, verification = mockAccountReceive().verification) {
  const input = buildVerifyAddressIntentInput(account, verification);
  const { connection, dmk } = connectionToUnresponsiveDevice();
  const states: VerifyAddressDeviceState[] = [];
  const subscription = input?.startAddressVerification(connection).observable.subscribe(state => {
    states.push(state);
  });

  return { dmk, states, subscription };
}

describe("buildVerifyAddressIntentInput", () => {
  beforeEach(() => {
    mockGetAddress
      .mockReset()
      .mockResolvedValue({ address: ADDRESS, publicKey: "", path: "44'/60'/0'/0/0" });
  });

  it("should expect the address the device derives and shows", () => {
    const { verification } = mockAccountReceive({ address: ADDRESS });

    expect(buildVerifyAddressIntentInput(ethereum, verification)?.expectedAddress).toBe(ADDRESS);
  });

  it("should ask the device to show the address at the verification path", async () => {
    const { states, subscription } = verifyOnDevice();

    await waitFor(() => expect(states).toContainEqual({ type: "confirmed", address: ADDRESS }));
    expect(mockGetAddress).toHaveBeenCalledWith(expect.anything(), {
      currency: ethereum.currency,
      derivationMode: ethereum.derivationMode,
      path: "44'/60'/0'/0/0",
      verify: true,
    });
    subscription?.unsubscribe();
  });

  it("should add the family getAddress params, like the Bitcoin Cash cashaddr format", async () => {
    const bch = genAccount("receive-verify-bch", {
      currency: getCryptoCurrencyById("bitcoin_cash"),
    });
    const { subscription } = verifyOnDevice(
      bch,
      mockAccountReceive({
        verification: { type: "address", path: "m/44h/145h/0h/0/0", address: bch.freshAddress },
      }).verification,
    );

    await waitFor(() =>
      expect(mockGetAddress).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ forceFormat: "cashaddr", path: "44'/145'/0'/0/0" }),
      ),
    );
    subscription?.unsubscribe();
  });

  it("should report the address on the Secure Screen only once the device request is sent", async () => {
    const getAddressActual = jest.requireActual<{ default: typeof getAddress }>(
      "@ledgerhq/live-common/hw/getAddress/index",
    ).default;
    mockGetAddress.mockImplementation(getAddressActual);

    const { dmk, states, subscription } = verifyOnDevice();
    expect(states).toEqual([]);

    await waitFor(() => expect(dmk.executeDeviceAction).toHaveBeenCalled());
    expect(states).toEqual([{ type: "awaiting-confirmation" }]);
    subscription?.unsubscribe();
  });

  it.each([
    { type: "addressConfirmation", path: PATH, address: ADDRESS },
    { type: "shieldedAddress", path: PATH, address: ADDRESS },
    { type: "publicKey", path: PATH, publicKey: "302a" },
  ] as const)("should build no input when the device can only confirm a $type", input => {
    const { verification } = mockAccountReceive({ verification: input });

    expect(buildVerifyAddressIntentInput(ethereum, verification)).toBeUndefined();
  });

  it("should build no input when the device cannot confirm the address", () => {
    expect(buildVerifyAddressIntentInput(ethereum, undefined)).toBeUndefined();
  });

  it("should build no input for the shielded address, which getAddress does not derive", () => {
    const { shielded } = mockAccountReceive({
      shielded: {
        address: "zs1shielded",
        verification: { type: "shieldedAddress", path: PATH, address: "zs1shielded" },
      },
    });

    expect(buildVerifyAddressIntentInput(ethereum, shielded?.verification)).toBeUndefined();
  });
});

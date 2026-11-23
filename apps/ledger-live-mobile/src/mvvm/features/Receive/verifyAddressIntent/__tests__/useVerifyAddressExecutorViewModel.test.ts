import { renderHook, waitFor } from "@tests/test-renderer";
import { AddressSchema, DerivationPathSchema } from "@domain/entity-account-descriptor";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { VerifyAddressDeviceState } from "@features/platform-intent-verify-address";
import {
  getCryptoAssetsStore,
  setCryptoAssetsStore,
} from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { createFixtureTokenAccount } from "@ledgerhq/live-common/mock/fixtures/cryptoCurrencies";
import { NEVER } from "rxjs";
import { useVerifyAddressExecutorViewModel } from "../useVerifyAddressExecutorViewModel";
import { VERIFY_ACCOUNT, VERIFY_SELECTION, withVerifyAccount } from "./verifyAddress.fixture";

jest.mock("@ledgerhq/live-common/hw/getAddress/index", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockGetAddress = jest.mocked(getAddress);
const getAddressActual = jest.requireActual<{ default: typeof getAddress }>(
  "@ledgerhq/live-common/hw/getAddress/index",
).default;
const defaultCryptoAssetsStore = getCryptoAssetsStore();
const { token: USDT } = createFixtureTokenAccount();
const TOKEN_SELECTION = {
  ...VERIFY_SELECTION,
  assetId: CryptoOrTokenCurrencyIdSchema.parse(USDT.id),
};

function withTokenStore(findTokenById: typeof defaultCryptoAssetsStore.findTokenById) {
  setCryptoAssetsStore({ ...defaultCryptoAssetsStore, findTokenById });
}

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

async function renderReadyViewModel(
  params: Partial<Parameters<typeof useVerifyAddressExecutorViewModel>[0]> = {},
) {
  const { result } = renderHook(
    () =>
      useVerifyAddressExecutorViewModel({
        selection: VERIFY_SELECTION,
        onExit: jest.fn(),
        ...params,
      }),
    { overrideInitialState: withVerifyAccount },
  );
  await waitFor(() => expect(result.current).not.toBeNull());
  return { executor: () => result.current! };
}

async function startDeviceVerification() {
  const { executor } = await renderReadyViewModel();
  const { connection, dmk } = connectionToUnresponsiveDevice();
  const states: VerifyAddressDeviceState[] = [];
  const subscription = executor()
    .intent.input.startAddressVerification(connection)
    .observable.subscribe(state => states.push(state));

  return { dmk, states, subscription };
}

describe("useVerifyAddressExecutorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAddress.mockReset();
  });

  afterEach(() => {
    setCryptoAssetsStore(defaultCryptoAssetsStore);
  });

  it("should check before the device shows anything that it derives the address shown, at its path", async () => {
    const shown = {
      type: "address",
      address: AddressSchema.parse("0x00000000219ab540356cBB839Cbe05303d7705Fa"),
      path: DerivationPathSchema.parse("m/44h/60h/0h/0/3"),
    } as const;

    const { executor } = await renderReadyViewModel({
      selection: { ...VERIFY_SELECTION, verification: shown },
    });

    expect(executor().deviceInitializationInput).toMatchObject({
      appName: "Ethereum",
      requiresDerivation: expect.objectContaining({ path: "44'/60'/0'/0/3" }),
    });
    expect(
      new Set(executor().deviceInitializationInput.expectedAccount?.acceptableDerivedAddresses),
    ).toEqual(new Set([shown.address]));
    expect(executor().intent.input.expectedAddress).toBe(shown.address);
  });

  it("should verify a token address in its parent app, tracked with the token ticker", async () => {
    withTokenStore(id => Promise.resolve(id === USDT.id ? USDT : undefined));

    const { executor } = await renderReadyViewModel({ selection: TOKEN_SELECTION });

    expect(executor().deviceInitializationInput).toMatchObject({ appName: "Ethereum" });
    expect(executor().analyticsProperties).toEqual({ asset: "USDT", network: "ethereum" });
  });

  describe("device verification", () => {
    it("should ask the device to show the address at the verification path", async () => {
      const address = VERIFY_ACCOUNT.freshAddress;
      mockGetAddress.mockResolvedValue({ address, publicKey: "", path: "44'/60'/0'/0/0" });

      const { states, subscription } = await startDeviceVerification();

      await waitFor(() => expect(states).toContainEqual({ type: "confirmed", address }));
      expect(mockGetAddress).toHaveBeenCalledWith(expect.anything(), {
        currency: VERIFY_ACCOUNT.currency,
        derivationMode: VERIFY_ACCOUNT.derivationMode,
        path: "44'/60'/0'/0/0",
        verify: true,
      });
      subscription.unsubscribe();
    });

    it("should report the address as shown once a DMK signer starts its device action", async () => {
      mockGetAddress.mockImplementation(getAddressActual);

      const { dmk, states, subscription } = await startDeviceVerification();
      expect(states).toEqual([]);

      await waitFor(() => expect(dmk.executeDeviceAction).toHaveBeenCalled());
      expect(states).toEqual([{ type: "awaiting-confirmation" }]);
      subscription.unsubscribe();
    });
  });
});

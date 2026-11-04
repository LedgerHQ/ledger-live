import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "../bridge";
import {
  canReceive,
  canSend,
  isNonTransferableToken,
  isReceiveDisabledForFamily,
  isSendDisabledForFamily,
} from "./support";

jest.mock("../bridge");
const mockGetAccountBridge = jest.mocked(getAccountBridge);

const ethAccount = genAccount("eth", { currency: getCryptoCurrencyById("ethereum") }) as Account;
const hypercoreAccount = genAccount("hc", {
  currency: getCryptoCurrencyById("hypercore"),
}) as Account;

const bridgeWith = (createTransaction: jest.Mock) =>
  ({ createTransaction }) as unknown as ReturnType<typeof getAccountBridge>;

beforeEach(() => jest.clearAllMocks());

describe("family transfer capability", () => {
  it("disables send and receive for hypercore, allows them for other families", () => {
    expect(isSendDisabledForFamily("hypercore")).toBe(true);
    expect(isReceiveDisabledForFamily("hypercore")).toBe(true);
    expect(isSendDisabledForFamily("ethereum")).toBe(false);
    expect(isReceiveDisabledForFamily("ethereum")).toBe(false);
  });

  it("canReceive follows the family capability", () => {
    expect(canReceive(hypercoreAccount, undefined)).toBe(false);
    expect(canReceive(ethAccount, undefined)).toBe(true);
  });
});

describe("canSend", () => {
  it("short-circuits to false for send-disabled families without probing the bridge", async () => {
    await expect(canSend(hypercoreAccount, undefined)).resolves.toBe(false);
    expect(mockGetAccountBridge).not.toHaveBeenCalled();
  });

  it("probes the bridge for other families", async () => {
    const createTransaction = jest.fn();
    mockGetAccountBridge.mockReturnValue(bridgeWith(createTransaction));
    await expect(canSend(ethAccount, undefined)).resolves.toBe(true);
    expect(mockGetAccountBridge).toHaveBeenCalled();
    expect(createTransaction).toHaveBeenCalled();
  });

  it("returns false when building a transaction throws", async () => {
    mockGetAccountBridge.mockReturnValue(
      bridgeWith(
        jest.fn(() => {
          throw new Error("cannot build");
        }),
      ),
    );
    await expect(canSend(ethAccount, undefined)).resolves.toBe(false);
  });
});

describe("isNonTransferableToken", () => {
  it.each([
    "ethereum/erc20/pooled_staked_eth",
    "ethereum/erc20/lc_staked_shared_eth_0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
    "ethereum/erc20/yield_bearing_aave_usdt_0x4d431856295413906075dd40266d83624e09c672",
    "ethereum/erc20/yield_bearing_aave_usdc_0xd2011d314acaa68e5401e7f5aec3be6d2c574dcf",
    "ethereum/erc20/yield_bearing_aave_dai_0x4ef971774c77865ff8ec35f274474cb0ed9c48fa",
    "ethereum/erc20/yield_bearing_aave_usds_0xd88714e295da03a07bcb8ad4a4dbe87fa42d75f9",
    "ethereum/erc20/yield_bearing_angle_usda_0x4b20748c3dd973f1456eccde4ff84d54792dcd3e",
  ])("flags %s", id => {
    expect(isNonTransferableToken({ id })).toBe(true);
  });

  it.each(["ethereum/erc20/usd_tether__erc20_", "ethereum"])("lets %s through", id => {
    expect(isNonTransferableToken({ id })).toBe(false);
  });
});

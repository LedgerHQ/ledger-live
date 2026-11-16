import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { deserializeError, serializeError } from "@ledgerhq/wallet-api-core";
import { getSponsoredCoinApi } from "../../bridge/generic-coin-framework/sponsored";
import { getWalletApiIdFromAccountId, setWalletApiIdForAccountId } from "../converters";
import type { GetFeatureFn } from "../FeatureFlags/resolver";
import { isTronifyEnergyDelivered, tronifyHandlers } from "./tronify";

jest.mock("../../bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(),
}));

const mockGetSponsoredCoinApi = jest.mocked(getSponsoredCoinApi);
const isEnergyDelivered = jest.fn();

const TRON_ADDRESS = "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3";

const tronAccount = {
  type: "Account",
  id: "js:2:tron:TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3:",
  currency: { id: "tron", family: "tron" },
  freshAddress: TRON_ADDRESS,
} as unknown as Account;

const tokenAccount = (id: string, tokenType: string): TokenAccount =>
  ({
    type: "TokenAccount",
    id,
    parentId: tronAccount.id,
    token: { tokenType },
  }) as unknown as TokenAccount;

const usdtAccount = tokenAccount(`${tronAccount.id}+usdt`, "trc20");
const trc10Account = tokenAccount(`${tronAccount.id}+1002000`, "trc10");

const ethAccount = {
  type: "Account",
  id: "js:2:ethereum:0xabc:",
  currency: { id: "ethereum", family: "evm" },
} as unknown as Account;
const erc20Account = {
  type: "TokenAccount",
  id: `${ethAccount.id}+usdc`,
  parentId: ethAccount.id,
  token: { tokenType: "erc20" },
} as unknown as TokenAccount;

const accounts: AccountLike[] = [tronAccount, usdtAccount, trc10Account, ethAccount, erc20Account];
for (const account of accounts) setWalletApiIdForAccountId(account.id);

const walletId = (account: AccountLike) => getWalletApiIdFromAccountId(account.id);

const flagOn: GetFeatureFn = () => ({ enabled: true });
const flagOff: GetFeatureFn = () => ({ enabled: false });

function check(params: unknown, getFeature: GetFeatureFn | undefined = flagOn) {
  return isTronifyEnergyDelivered(params as never, { accounts, getFeature });
}

describe("isTronifyEnergyDelivered", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSponsoredCoinApi.mockResolvedValue({ isEnergyDelivered } as never);
    isEnergyDelivered.mockResolvedValue(true);
  });

  it("reads the energy on the TRON account behind a TRC-20 token account", async () => {
    await expect(
      check({ fromAccountId: walletId(usdtAccount), energyNeeded: "31895" }),
    ).resolves.toEqual({
      delivered: true,
    });

    expect(mockGetSponsoredCoinApi).toHaveBeenCalledWith("tron", "local");
    expect(isEnergyDelivered).toHaveBeenCalledWith({
      receiverAddress: TRON_ADDRESS,
      energyNeeded: 31_895n,
    });
  });

  it("reports energy that has not arrived yet", async () => {
    isEnergyDelivered.mockResolvedValue(false);

    await expect(
      check({ fromAccountId: walletId(usdtAccount), energyNeeded: "31895" }),
    ).resolves.toEqual({
      delivered: false,
    });
  });

  it.each([
    ["no params", undefined],
    ["a zero threshold", { fromAccountId: "x", energyNeeded: "0" }],
    ["a negative threshold", { fromAccountId: "x", energyNeeded: "-1" }],
    ["a fractional threshold", { fromAccountId: "x", energyNeeded: "1.5" }],
    ["a leading zero", { fromAccountId: "x", energyNeeded: "031895" }],
    ["a numeric threshold", { fromAccountId: "x", energyNeeded: 31_895 }],
    ["no account id", { energyNeeded: "31895" }],
  ])("rejects %s before any network call", async (_label, params) => {
    await expect(check(params)).rejects.toMatchObject({ cause: "WRONG_TRONIFY_PARAMS" });
    expect(isEnergyDelivered).not.toHaveBeenCalled();
  });

  it.each([
    ["off", flagOff],
    ["missing", undefined],
  ])("rejects when the gasSponsorship flag is %s", async (_label, getFeature) => {
    const call = isTronifyEnergyDelivered(
      { fromAccountId: walletId(usdtAccount), energyNeeded: "31895" },
      { accounts, getFeature },
    );

    await expect(call).rejects.toMatchObject({ cause: "TRONIFY_DISABLED" });
    expect(mockGetSponsoredCoinApi).not.toHaveBeenCalled();
  });

  it("rejects a wallet API id the wallet does not know", async () => {
    await expect(
      check({ fromAccountId: "unknown-uuid", energyNeeded: "31895" }),
    ).rejects.toMatchObject({
      cause: "ACCOUNT_ID_NOT_FOUND",
    });
  });

  it.each([
    ["a native TRX account", tronAccount],
    ["a TRC-10 account", trc10Account],
    ["an ERC-20 account", erc20Account],
    ["a native ETH account", ethAccount],
  ])("rejects %s, which rents no energy", async (_label, account) => {
    await expect(
      check({ fromAccountId: walletId(account), energyNeeded: "31895" }),
    ).rejects.toMatchObject({
      cause: "TRONIFY_UNSUPPORTED_ACCOUNT",
    });
    expect(mockGetSponsoredCoinApi).not.toHaveBeenCalled();
  });

  it("rejects a TRC-20 account whose TRON parent is not in the wallet", async () => {
    const orphan = { ...usdtAccount, id: "orphan+usdt", parentId: "missing" } as TokenAccount;
    setWalletApiIdForAccountId(orphan.id);

    const call = isTronifyEnergyDelivered(
      { fromAccountId: walletId(orphan), energyNeeded: "31895" },
      { accounts: [...accounts, orphan], getFeature: flagOn },
    );

    await expect(call).rejects.toMatchObject({ cause: "TRONIFY_UNSUPPORTED_ACCOUNT" });
  });

  it("rejects when the wallet has no TRON sponsored seam", async () => {
    mockGetSponsoredCoinApi.mockResolvedValue(null);

    await expect(
      check({ fromAccountId: walletId(usdtAccount), energyNeeded: "31895" }),
    ).rejects.toMatchObject({
      cause: "TRONIFY_UNAVAILABLE",
    });
  });

  it("keeps the error code across the wallet API wire", async () => {
    const error = await check({ fromAccountId: "x", energyNeeded: "0" }).catch(e => e);

    const onTheWire = JSON.parse(JSON.stringify(serializeError(error)));

    expect(deserializeError(onTheWire)).toMatchObject({
      name: "ExchangeError",
      message: "tronify params are not correctly set",
      cause: "WRONG_TRONIFY_PARAMS",
    });
  });

  it("propagates an on-chain read failure instead of reporting no delivery", async () => {
    isEnergyDelivered.mockRejectedValue(new Error("TronGrid down"));

    await expect(
      check({ fromAccountId: walletId(usdtAccount), energyNeeded: "31895" }),
    ).rejects.toThrow("TronGrid down");
  });
});

describe("tronifyHandlers", () => {
  it("exposes the method id the exchange-module client calls", () => {
    expect(Object.keys(tronifyHandlers({ accounts, getFeature: flagOn }))).toEqual([
      "custom.exchange.tronify.isEnergyDelivered",
    ]);
  });
});

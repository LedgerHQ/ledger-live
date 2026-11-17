import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { deserializeError, serializeError } from "@ledgerhq/wallet-api-core";
import { buildGenericTransactionIntent } from "../../bridge/generic-coin-framework/buildIntent";
import { getSponsoredCoinApi } from "../../bridge/generic-coin-framework/sponsored";
import { genericValidateAddress } from "../../bridge/generic-coin-framework/validateAddress";
import {
  recordPendingRent,
  resetPendingRentsForTests,
} from "../../flows/send/sponsored/pendingRents";
import { getWalletApiIdFromAccountId, setWalletApiIdForAccountId } from "../converters";
import type { GetFeatureFn } from "../FeatureFlags/resolver";
import {
  createTronifyRentRecord,
  getTronifyQuote,
  getTronifyRentOrder,
  isTronifyEnergyDelivered,
  tronifyHandlers,
} from "./tronify";

jest.mock("../../bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(),
}));
jest.mock("../../bridge/generic-coin-framework/buildIntent", () => ({
  buildGenericTransactionIntent: jest.fn(),
}));
jest.mock("../../bridge/generic-coin-framework/validateAddress", () => ({
  genericValidateAddress: jest.fn(),
}));

const mockGetSponsoredCoinApi = jest.mocked(getSponsoredCoinApi);
const mockBuildIntent = jest.mocked(buildGenericTransactionIntent);
const mockGenericValidateAddress = jest.mocked(genericValidateAddress);
const isEnergyDelivered = jest.fn();
const estimateSponsoredFeeQuote = jest.fn();
const validateAddress = jest.fn();

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

function quote(params: unknown, getFeature: GetFeatureFn | undefined = flagOn) {
  return getTronifyQuote(params as never, { accounts, getFeature });
}

function expectNoQuote() {
  expect(estimateSponsoredFeeQuote).not.toHaveBeenCalled();
}

describe("getTronifyQuote", () => {
  const RECIPIENT = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";
  const INTENT = { type: "send", asset: { type: "trc20" } };
  const quoteParams = (overrides: Record<string, unknown> = {}) => ({
    fromAccountId: walletId(usdtAccount),
    recipient: RECIPIENT,
    amount: "1000000",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSponsoredCoinApi.mockResolvedValue({ estimateSponsoredFeeQuote } as never);
    mockGenericValidateAddress.mockReturnValue(validateAddress);
    validateAddress.mockResolvedValue(true);
    mockBuildIntent.mockResolvedValue(INTENT as never);
    estimateSponsoredFeeQuote.mockResolvedValue({
      feeAsset: {
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        unit: { name: "Tether USD", code: "USDT", magnitude: 6, showAllDigits: false },
      },
      value: 2_310_000n,
      originalValue: 13_500_000n,
    });
  });

  it("returns the seam's quote with bigints as decimal strings", async () => {
    await expect(quote(quoteParams())).resolves.toEqual({
      feeAsset: {
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        unit: { name: "Tether USD", code: "USDT", magnitude: 6 },
      },
      value: "2310000",
      originalValue: "13500000",
    });
    expect(estimateSponsoredFeeQuote).toHaveBeenCalledWith(INTENT);
  });

  it("builds the TRC-20 send intent on the TRON account, as the Send flow does", async () => {
    await quote(quoteParams());

    expect(mockGetSponsoredCoinApi).toHaveBeenCalledWith("tron", "local");
    expect(mockGenericValidateAddress).toHaveBeenCalledWith("tron", "local");
    expect(validateAddress).toHaveBeenCalledWith(RECIPIENT, {});
    expect(mockBuildIntent).toHaveBeenCalledWith("tron", "local", tronAccount, {
      family: "tron",
      recipient: RECIPIENT,
      amount: new BigNumber("1000000"),
      useAllAmount: false,
      subAccountId: usdtAccount.id,
    });
  });

  it.each([
    ["no params", undefined],
    ["no account id", quoteParams({ fromAccountId: undefined })],
    ["no recipient", quoteParams({ recipient: undefined })],
    ["an empty recipient", quoteParams({ recipient: "" })],
    ["a zero amount", quoteParams({ amount: "0" })],
    ["a negative amount", quoteParams({ amount: "-1" })],
    ["a fractional amount", quoteParams({ amount: "1.5" })],
    ["a numeric amount", quoteParams({ amount: 1_000_000 })],
  ])("rejects %s before any network call", async (_label, params) => {
    await expect(quote(params)).rejects.toMatchObject({ cause: "WRONG_TRONIFY_PARAMS" });
    expect(mockGetSponsoredCoinApi).not.toHaveBeenCalled();
    expectNoQuote();
  });

  it("rejects an invalid TRON recipient before building the intent", async () => {
    validateAddress.mockResolvedValue(false);

    await expect(quote(quoteParams({ recipient: "not-an-address" }))).rejects.toMatchObject({
      cause: "WRONG_TRONIFY_PARAMS",
    });
    expect(mockBuildIntent).not.toHaveBeenCalled();
    expectNoQuote();
  });

  it("rejects when the gasSponsorship flag is off", async () => {
    await expect(quote(quoteParams(), flagOff)).rejects.toMatchObject({
      cause: "TRONIFY_DISABLED",
    });
    expectNoQuote();
  });

  it("rejects a wallet API id the wallet does not know", async () => {
    await expect(quote(quoteParams({ fromAccountId: "unknown-uuid" }))).rejects.toMatchObject({
      cause: "ACCOUNT_ID_NOT_FOUND",
    });
    expectNoQuote();
  });

  it.each([
    ["a native TRX account", tronAccount],
    ["a TRC-10 account", trc10Account],
    ["an ERC-20 account", erc20Account],
  ])("rejects %s", async (_label, account) => {
    await expect(quote(quoteParams({ fromAccountId: walletId(account) }))).rejects.toMatchObject({
      cause: "TRONIFY_UNSUPPORTED_ACCOUNT",
    });
    expectNoQuote();
  });

  it("rejects when the wallet has no TRON sponsored seam", async () => {
    mockGetSponsoredCoinApi.mockResolvedValue(null);

    await expect(quote(quoteParams())).rejects.toMatchObject({ cause: "TRONIFY_UNAVAILABLE" });
  });

  it.each([
    ["EnergyRentUnsupportedIntent", "TRONIFY_UNSUPPORTED_TRANSFER"],
    ["EnergyRentProviderNotConfigured", "TRONIFY_UNAVAILABLE"],
    ["TronifyApiError", "TRONIFY_QUOTE_FAILED"],
    ["Error", "TRONIFY_QUOTE_FAILED"],
  ])("maps a %s from the quote to %s", async (name, cause) => {
    const error = new Error("boom");
    error.name = name;
    estimateSponsoredFeeQuote.mockRejectedValue(error);

    await expect(quote(quoteParams())).rejects.toMatchObject({ name: "ExchangeError", cause });
  });

  it("keeps the quote failure code across the wallet API wire", async () => {
    estimateSponsoredFeeQuote.mockRejectedValue(new Error("ECONNRESET"));
    const error = await quote(quoteParams()).catch(e => e);

    const onTheWire = JSON.parse(JSON.stringify(serializeError(error)));

    expect(deserializeError(onTheWire)).toMatchObject({
      name: "ExchangeError",
      message: "tronify quote failed: ECONNRESET",
      cause: "TRONIFY_QUOTE_FAILED",
    });
  });
});

function createRecord(params: unknown, getFeature: GetFeatureFn | undefined = flagOn) {
  return createTronifyRentRecord(params as never, { accounts, getFeature });
}

describe("createTronifyRentRecord", () => {
  const RECIPIENT = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";
  const INTENT = { type: "send", asset: { type: "trc20" } };
  const REQUEST = {
    payerAddress: TRON_ADDRESS,
    receiverAddress: TRON_ADDRESS,
    energy: 64_285n,
    durationSeconds: 3600,
    maxPayCoinAmt: "2.541",
    maxPayCoinCode: "USDT",
  };
  const TRANSACTION = { txID: "ab12", raw_data_hex: "0a02beef" };

  const TRONIFY_OPTION = { id: "tronify", feeAsset: { type: "trc20" } };
  const STANDARD_OPTION = { id: "standard", feeAsset: { type: "native" } };

  const listFeeOptions = jest.fn();
  const buildEnergyRentRequest = jest.fn();
  const craftEnergyRentTransaction = jest.fn();
  const classifyRentOrderError = jest.fn();
  const getEnergyRentSignaturePayload = (tx: typeof TRANSACTION) => ({
    toSign: tx.raw_data_hex,
    paymentTxId: tx.txID,
  });

  let orderSeq = 0;
  let orderId: string;

  const rentParams = (overrides: Record<string, unknown> = {}) => ({
    fromAccountId: walletId(usdtAccount),
    recipient: RECIPIENT,
    amount: "1000000",
    approvedFee: "2310000",
    ...overrides,
  });

  function expectNoOrder() {
    expect(craftEnergyRentTransaction).not.toHaveBeenCalled();
    expect(getTronifyRentOrder(orderId)).toBeUndefined();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    resetPendingRentsForTests();
    orderId = `order-${++orderSeq}`;
    mockGetSponsoredCoinApi.mockResolvedValue({
      feeOptionId: TRONIFY_OPTION.id,
      listFeeOptions,
      buildEnergyRentRequest,
      craftEnergyRentTransaction,
      classifyRentOrderError,
      getEnergyRentSignaturePayload,
    } as never);
    mockGenericValidateAddress.mockReturnValue(validateAddress);
    validateAddress.mockResolvedValue(true);
    mockBuildIntent.mockResolvedValue(INTENT as never);
    listFeeOptions.mockResolvedValue([TRONIFY_OPTION, STANDARD_OPTION]);
    buildEnergyRentRequest.mockResolvedValue(REQUEST);
    craftEnergyRentTransaction.mockImplementation(async () => ({
      orderId,
      transaction: TRANSACTION,
      payCoinCode: "USDT",
      payCoinAmt: "2.31",
      paymentExpiresAt: Date.now() + 60_000,
    }));
    classifyRentOrderError.mockReturnValue(null);
  });

  it("returns the unsigned rent payment of the order it created", async () => {
    await expect(createRecord(rentParams())).resolves.toEqual({
      orderId,
      rawTransaction: "0a02beef",
      paymentTxId: "ab12",
      payCoinCode: "USDT",
      payCoinAmt: "2.31",
      energyNeeded: "64285",
    });
    expect(buildEnergyRentRequest).toHaveBeenCalledWith(INTENT, 2_310_000n);
    expect(craftEnergyRentTransaction).toHaveBeenCalledWith(REQUEST);
  });

  it("builds the TRC-20 send intent on the TRON account, as the Send flow does", async () => {
    await createRecord(rentParams());

    expect(mockBuildIntent).toHaveBeenCalledWith("tron", "local", tronAccount, {
      family: "tron",
      recipient: RECIPIENT,
      amount: new BigNumber("1000000"),
      useAllAmount: false,
      subAccountId: usdtAccount.id,
    });
  });

  it("keeps the order it returned until 30s before its payment expires", async () => {
    const paymentExpiresAt = Date.now() + 60_000;
    craftEnergyRentTransaction.mockResolvedValue({
      orderId,
      transaction: TRANSACTION,
      payCoinCode: "USDT",
      payCoinAmt: "2.31",
      paymentExpiresAt,
    });

    const result = await createRecord(rentParams());

    expect(getTronifyRentOrder(result.orderId)).toEqual({
      orderId,
      mainAccountId: tronAccount.id,
      payerAddress: TRON_ADDRESS,
      transaction: TRANSACTION,
      paymentTxId: result.paymentTxId,
      energyNeeded: 64_285n,
      signableUntilMs: paymentExpiresAt - 30_000,
    });
  });

  it("drops the order once its payment is within 30s of expiring", async () => {
    jest.useFakeTimers({ now: 1_000_000 });
    try {
      craftEnergyRentTransaction.mockResolvedValue({
        orderId,
        transaction: TRANSACTION,
        payCoinCode: "USDT",
        payCoinAmt: "2.31",
        paymentExpiresAt: 1_000_000 + 60_000,
      });
      await createRecord(rentParams());

      jest.setSystemTime(1_000_000 + 29_999);
      expect(getTronifyRentOrder(orderId)).toMatchObject({ orderId });
      jest.setSystemTime(1_000_000 + 30_000);
      expect(getTronifyRentOrder(orderId)).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps one order per TRON account, whichever of its tokens sent", async () => {
    const usdcAccount = tokenAccount(`${tronAccount.id}+usdc`, "trc20");
    setWalletApiIdForAccountId(usdcAccount.id);
    const first = await createTronifyRentRecord(
      rentParams({ fromAccountId: walletId(usdcAccount) }),
      {
        accounts: [...accounts, usdcAccount],
        getFeature: flagOn,
      },
    );
    orderId = `order-${++orderSeq}`;
    const second = await createRecord(rentParams());

    expect(getTronifyRentOrder(first.orderId)).toBeUndefined();
    expect(getTronifyRentOrder(second.orderId)).toMatchObject({ mainAccountId: tronAccount.id });
  });

  it("rejects a transfer the Send flow would not offer Tronify for", async () => {
    listFeeOptions.mockResolvedValue([STANDARD_OPTION]);

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      cause: "TRONIFY_UNSUPPORTED_TRANSFER",
    });
    expect(listFeeOptions).toHaveBeenCalledWith(INTENT);
    expect(buildEnergyRentRequest).not.toHaveBeenCalled();
    expectNoOrder();
  });

  it("rejects while a rent the Send flow paid has not landed", async () => {
    recordPendingRent(
      {
        mainAccountId: tronAccount.id,
        orderId: "send-order",
        payerAddress: TRON_ADDRESS,
        paymentTxId: "cd34",
        receiverAddress: TRON_ADDRESS,
        energyNeeded: 64_285n,
      },
      Date.now() + 60_000,
    );

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      cause: "TRONIFY_RENT_PENDING",
    });
    expect(mockGetSponsoredCoinApi).not.toHaveBeenCalled();
    expectNoOrder();
  });

  it("rejects with an explicit code when the Tronify module fails to load", async () => {
    mockGetSponsoredCoinApi.mockRejectedValue(new Error("ChunkLoadError"));

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      name: "ExchangeError",
      cause: "TRONIFY_UNAVAILABLE",
    });
    expectNoOrder();
  });

  it("creates no order for a request a newer one replaced before ordering", async () => {
    let resolveOlder: (request: unknown) => void = () => {};
    buildEnergyRentRequest.mockImplementationOnce(
      () => new Promise(resolve => (resolveOlder = resolve)),
    );
    const older = createRecord(rentParams());
    await new Promise(setImmediate);
    const newer = await createRecord(rentParams());

    resolveOlder(REQUEST);

    await expect(older).rejects.toMatchObject({ cause: "TRONIFY_ORDER_FAILED" });
    expect(craftEnergyRentTransaction).toHaveBeenCalledTimes(1);
    expect(getTronifyRentOrder(newer.orderId)).toMatchObject({ orderId: newer.orderId });
  });

  it("keeps only the latest order of an account", async () => {
    const first = await createRecord(rentParams());
    orderId = `order-${++orderSeq}`;
    const second = await createRecord(rentParams());

    expect(getTronifyRentOrder(first.orderId)).toBeUndefined();
    expect(getTronifyRentOrder(second.orderId)).toMatchObject({ orderId: second.orderId });
  });

  it("fails an older order that resolves after a newer one, and keeps the newer one", async () => {
    let resolveOlder: (order: unknown) => void = () => {};
    craftEnergyRentTransaction.mockImplementationOnce(
      () => new Promise(resolve => (resolveOlder = resolve)),
    );
    const older = createRecord(rentParams());
    await new Promise(setImmediate);
    orderId = `order-${++orderSeq}`;
    const newer = await createRecord(rentParams());

    resolveOlder({
      orderId: "older-order",
      transaction: TRANSACTION,
      payCoinCode: "USDT",
      payCoinAmt: "2.31",
      paymentExpiresAt: Date.now() + 60_000,
    });

    await expect(older).rejects.toMatchObject({ cause: "TRONIFY_ORDER_FAILED" });
    expect(getTronifyRentOrder("older-order")).toBeUndefined();
    expect(getTronifyRentOrder(newer.orderId)).toMatchObject({ orderId: newer.orderId });
  });

  it.each([
    ["has already expired", -1],
    ["expires within 30s", 29_000],
    ["has no valid expiry", Number.NaN],
  ])("fails an order whose payment %s, and keeps nothing", async (_label, expiresIn) => {
    craftEnergyRentTransaction.mockResolvedValue({
      orderId,
      transaction: TRANSACTION,
      payCoinCode: "USDT",
      payCoinAmt: "2.31",
      paymentExpiresAt: Date.now() + expiresIn,
    });

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      cause: "TRONIFY_ORDER_FAILED",
    });
    expect(getTronifyRentOrder(orderId)).toBeUndefined();
  });

  it("fails with an explicit code when the intent cannot be built", async () => {
    mockBuildIntent.mockRejectedValue(new Error("token not found"));

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      cause: "TRONIFY_ORDER_FAILED",
    });
    expectNoOrder();
  });

  it("rejects a transfer the energy rent does not support before any order", async () => {
    const error = new Error("Energy rent is only available for TRC-20 send intents");
    error.name = "EnergyRentUnsupportedIntent";
    buildEnergyRentRequest.mockRejectedValue(error);

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      cause: "TRONIFY_UNSUPPORTED_TRANSFER",
    });
    expectNoOrder();
  });

  it.each([
    ["no params", undefined],
    ["no approved fee", rentParams({ approvedFee: undefined })],
    ["a zero approved fee", rentParams({ approvedFee: "0" })],
    ["a fractional approved fee", rentParams({ approvedFee: "2.31" })],
    ["a numeric approved fee", rentParams({ approvedFee: 2_310_000 })],
    ["no recipient", rentParams({ recipient: undefined })],
    ["a zero amount", rentParams({ amount: "0" })],
    ["a raw transaction instead of a transfer", { rawTransaction: "0a02beef" }],
  ])("rejects %s before any network call", async (_label, params) => {
    await expect(createRecord(params)).rejects.toMatchObject({ cause: "WRONG_TRONIFY_PARAMS" });
    expect(mockGetSponsoredCoinApi).not.toHaveBeenCalled();
    expectNoOrder();
  });

  it("rejects when the gasSponsorship flag is off", async () => {
    await expect(createRecord(rentParams(), flagOff)).rejects.toMatchObject({
      cause: "TRONIFY_DISABLED",
    });
    expectNoOrder();
  });

  it("rejects a native TRX account", async () => {
    await expect(
      createRecord(rentParams({ fromAccountId: walletId(tronAccount) })),
    ).rejects.toMatchObject({ cause: "TRONIFY_UNSUPPORTED_ACCOUNT" });
    expectNoOrder();
  });

  it("rejects an invalid TRON recipient before building the request", async () => {
    validateAddress.mockResolvedValue(false);

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      cause: "WRONG_TRONIFY_PARAMS",
    });
    expect(buildEnergyRentRequest).not.toHaveBeenCalled();
    expectNoOrder();
  });

  it("creates no order when the balance does not cover the transfer plus the rent", async () => {
    const error = new Error("USDT balance does not cover the transfer amount plus the energy rent");
    error.name = "EnergyRentInsufficientBalance";
    buildEnergyRentRequest.mockRejectedValue(error);
    classifyRentOrderError.mockReturnValue({ reason: "insufficientBalance" });

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      name: "ExchangeError",
      cause: "TRONIFY_INSUFFICIENT_BALANCE",
    });
    expectNoOrder();
  });

  it("reports the rent Tronify offered above the approved fee", async () => {
    craftEnergyRentTransaction.mockRejectedValue(new Error("ceiling"));
    classifyRentOrderError.mockReturnValue({
      reason: "priceAboveApproved",
      offered: { asset: {}, amount: 2_900_000n },
    });

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      cause: "TRONIFY_PRICE_ABOVE_APPROVED",
      message: "tronify rent of 2900000 base units is above the approved fee",
    });
    expect(getTronifyRentOrder(orderId)).toBeUndefined();
  });

  it.each([
    ["EnergyRentProviderNotConfigured", "TRONIFY_UNAVAILABLE"],
    ["TronifyApiError", "TRONIFY_ORDER_FAILED"],
    ["Error", "TRONIFY_ORDER_FAILED"],
  ])("maps a %s from the order to %s and keeps nothing", async (name, cause) => {
    const error = new Error("payee");
    error.name = name;
    craftEnergyRentTransaction.mockRejectedValue(error);

    await expect(createRecord(rentParams())).rejects.toMatchObject({
      name: "ExchangeError",
      cause,
    });
    expect(getTronifyRentOrder(orderId)).toBeUndefined();
  });

  it("keeps the order failure code across the wallet API wire", async () => {
    craftEnergyRentTransaction.mockRejectedValue(new Error("payee not listed"));
    const error = await createRecord(rentParams()).catch(e => e);

    const onTheWire = JSON.parse(JSON.stringify(serializeError(error)));

    expect(deserializeError(onTheWire)).toMatchObject({
      name: "ExchangeError",
      message: "tronify rent order failed: payee not listed",
      cause: "TRONIFY_ORDER_FAILED",
    });
  });
});

describe("tronifyHandlers", () => {
  it("exposes the method ids the exchange-module client calls", () => {
    expect(Object.keys(tronifyHandlers({ accounts, getFeature: flagOn }))).toEqual([
      "custom.exchange.tronify.getQuote",
      "custom.exchange.tronify.createRentRecord",
      "custom.exchange.tronify.isEnergyDelivered",
    ]);
  });
});

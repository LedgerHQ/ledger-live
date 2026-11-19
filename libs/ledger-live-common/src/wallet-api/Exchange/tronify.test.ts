import BigNumber from "bignumber.js";
import { createSponsoredSendApi } from "@ledgerhq/coin-tron/api/index";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { deserializeError, serializeError } from "@ledgerhq/wallet-api-core";
import { buildGenericTransactionIntent } from "../../bridge/generic-coin-framework/buildIntent";
import { getSponsoredCoinApi } from "../../bridge/generic-coin-framework/sponsored";
import { genericValidateAddress } from "../../bridge/generic-coin-framework/validateAddress";
import {
  getPendingRent,
  getRentDelivery,
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
  uploadTronifyHash,
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
    resetPendingRentsForTests();
    mockGetSponsoredCoinApi.mockResolvedValue({ isEnergyDelivered } as never);
    isEnergyDelivered.mockResolvedValue(true);
  });

  const holdRent = (
    rent: { paymentTxId?: string; energyNeeded?: bigint; submitting?: boolean } = {},
  ) =>
    recordPendingRent(
      {
        mainAccountId: tronAccount.id,
        orderId: "order",
        payerAddress: TRON_ADDRESS,
        paymentTxId: "ab12",
        receiverAddress: TRON_ADDRESS,
        energyNeeded: 31_895n,
        ...rent,
      },
      Date.now() + 60_000,
    );
  const deliveredParams = { fromAccountId: walletId(usdtAccount), energyNeeded: "31895" };

  it("releases the account's rent hold once its energy is on-chain", async () => {
    holdRent();

    await check(deliveredParams);

    expect(getPendingRent(tronAccount.id)).toBeNull();
    expect(getRentDelivery(tronAccount.id)).toMatchObject({ paymentTxId: "ab12" });
  });

  it("keeps a rent held after the read started, even when the read reports delivery", async () => {
    let resolveRead: (delivered: boolean) => void = () => {};
    isEnergyDelivered.mockImplementationOnce(() => new Promise(resolve => (resolveRead = resolve)));
    holdRent({ paymentTxId: "old" });
    const read = check(deliveredParams);
    await new Promise(setImmediate);
    holdRent({ paymentTxId: "new" });

    resolveRead(true);
    await read;

    expect(getPendingRent(tronAccount.id)).toMatchObject({ paymentTxId: "new" });
  });

  it("releases nothing when no rent was held as the read started", async () => {
    let resolveRead: (delivered: boolean) => void = () => {};
    isEnergyDelivered.mockImplementationOnce(() => new Promise(resolve => (resolveRead = resolve)));
    const read = check(deliveredParams);
    await new Promise(setImmediate);
    holdRent();

    resolveRead(true);
    await read;

    expect(getPendingRent(tronAccount.id)).toMatchObject({ paymentTxId: "ab12" });
  });

  it.each([
    ["the energy has not arrived", {}, false],
    ["the rent is still submitting", { submitting: true }, true],
    ["the rent needs more energy than was checked", { energyNeeded: 31_896n }, true],
  ])("keeps the rent hold when %s", async (_label, rent, delivered) => {
    holdRent(rent);
    isEnergyDelivered.mockResolvedValue(delivered);

    await check(deliveredParams);

    expect(getPendingRent(tronAccount.id)).toMatchObject({ paymentTxId: "ab12" });
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
      receiverAddress: TRON_ADDRESS,
      transaction: TRANSACTION,
      paymentTxId: result.paymentTxId,
      energyNeeded: 64_285n,
      paymentExpiresAt,
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

function upload(params: unknown, getFeature: GetFeatureFn | undefined = flagOn) {
  return uploadTronifyHash(params as never, { accounts, getFeature });
}

describe("uploadTronifyHash", () => {
  // A USDT transfer owned by the address of private key 0x11…11, and that key's signature over it.
  const TRANSACTION = {
    txID: "ab12",
    raw_data_hex:
      "0a020ee522082e5fc67747a428af40f0e2ace4d3325aad01081f12a8010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412730a154119e7e376e7c213b7e7e7e46cc70a5dd086daff2a121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2243a9059cbb000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa000000000000000000000000000000000000000000000000000000000f424070fd9ca9e4d33290018087a70e",
  };
  const SIGNATURE =
    "b012c72290538ab3e61c3c22fb3662f85f9c87f1ec4cc0d686b42dcf5fb48e580035b3c7d44563a1bd34c366769b3960e9da6695ee38702130297f7cdef693d31c";
  // The same transaction signed by private key 0x22…22.
  const OTHER_KEY_SIGNATURE =
    "267b81f7c0b37f346dc223a5fb2b70b2bf69cc60fb80a5a2776f6b11e0a8b9bf350ce81efdeeb787e1bd93bee9d704e5dc19ac243a3ca205c84bc5d4b9d8e0a11b";
  // The `transaction.signRaw` output: 4-hex-char length prefix, echoed raw tx, signature.
  const lengthPrefix = (rawDataHex: string) => rawDataHex.length.toString(16).padStart(4, "0");
  const SIGNED_HEX = `${lengthPrefix(TRANSACTION.raw_data_hex)}${TRANSACTION.raw_data_hex}${SIGNATURE}`;
  const SIGNED_TRANSACTION = { ...TRANSACTION, signature: [SIGNATURE] };
  const ENERGY_NEEDED = 64_285n;

  // coin-tron's own builder, so the signature checks run for real.
  const tronSeam = createSponsoredSendApi({
    logger: jest.fn(),
    config: jest.fn(),
  } as unknown as Parameters<typeof createSponsoredSendApi>[0]);
  const buildSignedEnergyRentTransaction = jest.fn();
  const submitEnergyRentPayment = jest.fn();

  let orderSeq = 0;
  let orderId: string;
  let paymentExpiresAt: number;

  const uploadParams = (overrides: Record<string, unknown> = {}) => ({
    fromAccountId: walletId(usdtAccount),
    orderId,
    signedTransactionHex: SIGNED_HEX,
    ...overrides,
  });

  async function createOrder() {
    await createRecord({
      fromAccountId: walletId(usdtAccount),
      recipient: "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1",
      amount: "1000000",
      approvedFee: "2310000",
    });
  }

  function expectNoSubmit() {
    expect(submitEnergyRentPayment).not.toHaveBeenCalled();
    expect(getPendingRent(tronAccount.id)).toBeNull();
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    resetPendingRentsForTests();
    orderId = `upload-order-${++orderSeq}`;
    paymentExpiresAt = Date.now() + 60_000;
    mockGetSponsoredCoinApi.mockResolvedValue({
      feeOptionId: "tronify",
      listFeeOptions: async () => [{ id: "tronify" }],
      buildEnergyRentRequest: async () => ({
        payerAddress: TRON_ADDRESS,
        receiverAddress: TRON_ADDRESS,
        energy: ENERGY_NEEDED,
        durationSeconds: 3600,
      }),
      craftEnergyRentTransaction: async () => ({
        orderId,
        transaction: TRANSACTION,
        payCoinCode: "USDT",
        payCoinAmt: "2.31",
        paymentExpiresAt,
      }),
      classifyRentOrderError: () => null,
      getEnergyRentSignaturePayload: (tx: typeof TRANSACTION) => ({
        toSign: tx.raw_data_hex,
        paymentTxId: tx.txID,
      }),
      buildSignedEnergyRentTransaction,
      submitEnergyRentPayment,
    } as never);
    mockGenericValidateAddress.mockReturnValue(validateAddress);
    validateAddress.mockResolvedValue(true);
    mockBuildIntent.mockResolvedValue({ type: "send" } as never);
    buildSignedEnergyRentTransaction.mockImplementation(tronSeam.buildSignedEnergyRentTransaction);
    submitEnergyRentPayment.mockResolvedValue(undefined);
    await createOrder();
  });

  it("submits the order's payment with the device signature, once", async () => {
    await expect(upload(uploadParams())).resolves.toEqual({ paymentTxId: "ab12" });

    expect(buildSignedEnergyRentTransaction).toHaveBeenCalledWith(TRANSACTION, SIGNED_HEX);
    expect(submitEnergyRentPayment).toHaveBeenCalledTimes(1);
    expect(submitEnergyRentPayment).toHaveBeenCalledWith({
      orderId,
      signedTransaction: SIGNED_TRANSACTION,
    });
  });

  it("holds the account until the rented energy lands, as the Send flow does", async () => {
    await upload(uploadParams());

    expect(getPendingRent(tronAccount.id)).toEqual({
      mainAccountId: tronAccount.id,
      orderId,
      payerAddress: TRON_ADDRESS,
      paymentTxId: "ab12",
      receiverAddress: TRON_ADDRESS,
      energyNeeded: ENERGY_NEEDED,
      submitting: false,
      expiresAt: expect.any(Number),
    });
    await expect(createOrder()).rejects.toMatchObject({ cause: "TRONIFY_RENT_PENDING" });
  });

  it("holds the account while the submit is in flight", async () => {
    let held: unknown;
    submitEnergyRentPayment.mockImplementation(async () => {
      held = getPendingRent(tronAccount.id);
    });

    await upload(uploadParams());

    expect(held).toMatchObject({ paymentTxId: "ab12", submitting: true });
  });

  it("rejects a replayed order without a second submit", async () => {
    await upload(uploadParams());

    await expect(upload(uploadParams())).rejects.toMatchObject({
      cause: "TRONIFY_ORDER_NOT_FOUND",
    });
    expect(submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  });

  it("submits once when the same order is uploaded twice concurrently", async () => {
    const results = await Promise.allSettled([upload(uploadParams()), upload(uploadParams())]);

    expect(results.map(result => result.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown order before any Tronify call", async () => {
    await expect(upload(uploadParams({ orderId: "unknown" }))).rejects.toMatchObject({
      cause: "TRONIFY_ORDER_NOT_FOUND",
    });
    expect(buildSignedEnergyRentTransaction).not.toHaveBeenCalled();
    expectNoSubmit();
  });

  it("rejects an order whose payment can no longer be signed", async () => {
    jest.useFakeTimers({ now: paymentExpiresAt - 30_000 });
    try {
      await expect(upload(uploadParams())).rejects.toMatchObject({
        cause: "TRONIFY_ORDER_NOT_FOUND",
      });
    } finally {
      jest.useRealTimers();
    }
    expectNoSubmit();
  });

  it("rejects an account that is not the order's payer", async () => {
    const otherTron = {
      ...tronAccount,
      id: "js:2:tron:TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1:",
    } as Account;
    const otherUsdt = { ...usdtAccount, id: `${otherTron.id}+usdt`, parentId: otherTron.id };
    setWalletApiIdForAccountId(otherUsdt.id);

    await expect(
      uploadTronifyHash(uploadParams({ fromAccountId: walletId(otherUsdt) }), {
        accounts: [...accounts, otherTron, otherUsdt],
        getFeature: flagOn,
      }),
    ).rejects.toMatchObject({ cause: "WRONG_TRONIFY_PARAMS" });
    expectNoSubmit();
    expect(getTronifyRentOrder(orderId)).toMatchObject({ orderId });
  });

  it.each([
    ["a signature by another key", SIGNED_HEX.replace(SIGNATURE, OTHER_KEY_SIGNATURE)],
    ["a signature over other bytes", `0008deadbeef${SIGNATURE}`],
    ["a wrong length prefix", `0000${SIGNED_HEX.slice(4)}`],
    ["a missing signature", SIGNED_HEX.replace(SIGNATURE, "")],
  ])("rejects %s and keeps the order for a new signature", async (_label, signedTransactionHex) => {
    await expect(upload(uploadParams({ signedTransactionHex }))).rejects.toMatchObject({
      cause: "WRONG_TRONIFY_PARAMS",
    });
    expectNoSubmit();

    await expect(upload(uploadParams())).resolves.toEqual({ paymentTxId: "ab12" });
  });

  it("rejects while another rent of the account has not landed", async () => {
    recordPendingRent(
      {
        mainAccountId: tronAccount.id,
        orderId: "send-order",
        payerAddress: TRON_ADDRESS,
        paymentTxId: "cd34",
        receiverAddress: TRON_ADDRESS,
        energyNeeded: ENERGY_NEEDED,
      },
      Date.now() + 60_000,
    );

    await expect(upload(uploadParams())).rejects.toMatchObject({
      cause: "TRONIFY_RENT_PENDING",
    });
    expect(submitEnergyRentPayment).not.toHaveBeenCalled();
  });

  it.each([
    ["no params", undefined],
    ["no order id", { orderId: undefined }],
    ["an empty order id", { orderId: "" }],
    ["no signed transaction", { signedTransactionHex: undefined }],
    ["a non-hex signed transaction", { signedTransactionHex: "0x0a02" }],
    ["an odd-length signed transaction", { signedTransactionHex: "0a0" }],
  ])("rejects %s before any network call", async (_label, overrides) => {
    mockGetSponsoredCoinApi.mockClear();
    const params = overrides === undefined ? undefined : uploadParams(overrides);

    await expect(upload(params)).rejects.toMatchObject({ cause: "WRONG_TRONIFY_PARAMS" });
    expect(mockGetSponsoredCoinApi).not.toHaveBeenCalled();
    expectNoSubmit();
  });

  it("rejects when the gasSponsorship flag is off", async () => {
    await expect(upload(uploadParams(), flagOff)).rejects.toMatchObject({
      cause: "TRONIFY_DISABLED",
    });
    expectNoSubmit();
  });

  it("rejects a native TRX account", async () => {
    await expect(
      upload(uploadParams({ fromAccountId: walletId(tronAccount) })),
    ).rejects.toMatchObject({ cause: "TRONIFY_UNSUPPORTED_ACCOUNT" });
    expectNoSubmit();
  });

  it("fails with an explicit code, keeps the hold and drops the order when the submit fails", async () => {
    submitEnergyRentPayment.mockRejectedValue(new Error("timeout"));

    await expect(upload(uploadParams())).rejects.toMatchObject({
      name: "ExchangeError",
      message: "tronify rent payment upload failed: timeout",
      cause: "TRONIFY_UPLOAD_FAILED",
    });
    // Not submitting any more, so a delivery check can still release it if the payment landed.
    expect(getPendingRent(tronAccount.id)).toMatchObject({
      paymentTxId: "ab12",
      submitting: false,
    });
    expect(getTronifyRentOrder(orderId)).toBeUndefined();
  });

  it("keeps the upload failure code across the wallet API wire", async () => {
    submitEnergyRentPayment.mockRejectedValue(new Error("timeout"));
    const error = await upload(uploadParams()).catch(e => e);

    const onTheWire = JSON.parse(JSON.stringify(serializeError(error)));

    expect(deserializeError(onTheWire)).toMatchObject({
      name: "ExchangeError",
      cause: "TRONIFY_UPLOAD_FAILED",
    });
  });
});

describe("tronifyHandlers", () => {
  it("exposes the method ids the exchange-module client calls", () => {
    expect(Object.keys(tronifyHandlers({ accounts, getFeature: flagOn }))).toEqual([
      "custom.exchange.tronify.getQuote",
      "custom.exchange.tronify.createRentRecord",
      "custom.exchange.tronify.uploadHash",
      "custom.exchange.tronify.isEnergyDelivered",
    ]);
  });
});

import type { Logger } from "@ledgerhq/coin-module-framework/config";
import BigNumber from "bignumber.js";
import { type TronCoinConfig } from "../../config";
import {
  addTronRentRecord,
  myPayOrder,
  queryPreorderInfo,
  uploadHash,
} from "../../network/tronify";
import { decode58Check } from "../../network/format";
import { decodeTransaction } from "../utils";
import {
  EnergyDelegationTimeoutError,
  EnergyDeliveryAbortedError,
  EnergyRentProviderNotConfigured,
  TronifyApiError,
} from "../../types/errors";
import {
  awaitEnergyDelivery,
  awaitEnergyDeliveryWith,
  broadcastEnergyRentTransaction,
  craftEnergyRentTransaction,
  getEnergyProvider,
  getEnergyRentQuote,
  getEnergyRentStatus,
  isEnergyDeliveredOnChain,
  type EnergyRentStatus,
} from "./index";
import { getTronAccountNetwork } from "../../network";

jest.mock("../../network/tronify", () => ({
  // Keep the real getTronifyConfig (validates the config passed to getEnergyProvider) so the
  // configuration gate is exercised for real; only the network calls are stubbed.
  ...jest.requireActual("../../network/tronify"),
  queryPreorderInfo: jest.fn(),
  addTronRentRecord: jest.fn(),
  uploadHash: jest.fn(),
  myPayOrder: jest.fn(),
}));

// craftEnergyRentTransaction decodes raw_data_hex to verify the signed bytes, so mock the decoder
// to drive the decoded shape without constructing real TRON tx bytes.
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  decodeTransaction: jest.fn(),
}));

// The on-chain delivery gate reads the receiver's resource state via getTronAccountNetwork; stub it
// to drive the energy the receiver holds mid-poll without hitting a node.
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  getTronAccountNetwork: jest.fn(),
}));

const mockedGetTronAccountNetwork = getTronAccountNetwork as jest.MockedFunction<
  typeof getTronAccountNetwork
>;

const mockedQueryPreorderInfo = queryPreorderInfo as jest.MockedFunction<typeof queryPreorderInfo>;
const mockedAddTronRentRecord = addTronRentRecord as jest.MockedFunction<typeof addTronRentRecord>;
const mockedUploadHash = uploadHash as jest.MockedFunction<typeof uploadHash>;
const mockedMyPayOrder = myPayOrder as jest.MockedFunction<typeof myPayOrder>;
const mockedDecodeTransaction = decodeTransaction as jest.MockedFunction<typeof decodeTransaction>;

const mockLogger: Logger = jest.fn();

const purchaseOrder = (overrides: Record<string, unknown>) => ({
  orderId: "order-1",
  fromAddress: request.payerAddress,
  pledgeAddress: request.receiverAddress,
  pledgeNum: 32000,
  salePledgeNum: 0,
  freezePledgeNum: 0,
  leftPledgeNum: 32000,
  orderPrice: "110",
  orderType: "ENERGY",
  pledgeDay: "0",
  orderStatus: "wait_sale",
  createTime: "2026-07-30 10:00:00",
  ...overrides,
});

const tronifyConfig = (): TronCoinConfig =>
  ({
    status: { type: "active" },
    explorer: { url: "https://tron.coin.ledger.com" },
    energyRent: {
      provider: "tronify",
      tronify: { url: "https://open.tronify.io", sourceFlag: "ll" },
    },
  }) as unknown as TronCoinConfig;

const request = {
  payerAddress: "TKghVbeEzvrV8GLK3YE1gRrjVHSf8rGB6k",
  receiverAddress: "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1",
  energy: 32000n,
  durationSeconds: 600,
};

// A signable order's txID must be sha256(raw_data), which assertSignableOrder recomputes from
// raw_data_hex. These are a matching pair (SIGNABLE_TX_ID = sha256("abcd")), hardcoded rather than
// derived so a wrong production hash breaks the success-path fixtures instead of silently tracking it.
const SIGNABLE_RAW_DATA_HEX = "abcd";
const SIGNABLE_TX_ID = "123d4c7ef2d1600a1b3a0f6addc60a10f05a3495c9409f2ecbf4cc095d000a6b";

// A decoded native-TRX TransferContract from the payer for `amount` sun — the shape
// craftEnergyRentTransaction's signed-bytes check expects. Overridable to drive the negative cases.
const decodedTransfer = (
  overrides: { type?: string; owner_address?: string; amount?: number } = {},
) => ({
  txID: "abc",
  raw_data_hex: "abcd",
  raw_data: {
    contract: [
      {
        type: overrides.type ?? "TransferContract",
        parameter: {
          value: {
            owner_address: overrides.owner_address ?? decode58Check(request.payerAddress),
            to_address: decode58Check(request.receiverAddress),
            amount: overrides.amount ?? 100,
          },
        },
      },
    ],
  },
});

describe("energyRent provider switch", () => {
  let config: TronCoinConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    config = tronifyConfig();
    mockedDecodeTransaction.mockResolvedValue(decodedTransfer());
  });

  describe("getEnergyProvider", () => {
    it("returns the tronify provider when selected", () => {
      expect(getEnergyProvider(config).id).toBe("tronify");
    });

    it("throws when no provider is configured", () => {
      config = {
        status: { type: "active" },
        explorer: { url: "https://tron.coin.ledger.com" },
      } as unknown as TronCoinConfig;
      expect(() => getEnergyProvider(config)).toThrow(EnergyRentProviderNotConfigured);
    });

    // Remote coin-config is unvalidated: a provider named "tronify" whose nested settings are absent
    // or incomplete must not resolve, or the raw-signing gate would open with no configured provider.
    it.each([
      ["the tronify settings are absent", undefined],
      ["the tronify settings are empty", {}],
      ["the url is missing", { sourceFlag: "ll" }],
      ["the sourceFlag is missing", { url: "https://open.tronify.io" }],
    ])("throws when %s", (_label, tronify) => {
      config = {
        status: { type: "active" },
        explorer: { url: "https://tron.coin.ledger.com" },
        energyRent: { provider: "tronify", tronify },
      } as unknown as TronCoinConfig;
      expect(() => getEnergyProvider(config)).toThrow(EnergyRentProviderNotConfigured);
    });
  });

  describe("getEnergyRentQuote", () => {
    it("maps the Tronify quote to a provider-agnostic quote", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({
        pledgeNum: 32000,
        payCoinCode: "USDT",
        payCoinAmt: "3.124527",
        purchaseEnergyFee: "2.727422",
        purchaseTRXFee: "0.397105",
        purchaseBandwidthFee: "0",
        activeAccountFee: "0",
      } as never);

      const quote = await getEnergyRentQuote(mockLogger, config, request);

      expect(quote).toEqual({
        energy: 32000n,
        durationSeconds: 600,
        payCoinCode: "USDT",
        payCoinAmt: "3.124527",
        fees: { energy: "2.727422", trx: "0.397105", bandwidth: "0", activateAccount: "0" },
      });
    });

    it("rounds a duration up to the next window Tronify sells and reports it back", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({ pledgeNum: 32000 } as never);

      // 2h is not a window Tronify sells — it must be quoted (and priced) as the 3h one.
      const quote = await getEnergyRentQuote(mockLogger, config, {
        ...request,
        durationSeconds: 2 * 3600,
      });

      expect(quote.durationSeconds).toBe(3 * 3600);
      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith(
        mockLogger,
        config,
        expect.objectContaining({ pledgeDay: "0", pledgeHour: "3", pledgeMinute: "0" }),
      );
    });

    it("maps a 10-minute duration to the fastTrade window and defaults extraTrxNum to 0", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({ pledgeNum: 32000 } as never);

      await getEnergyRentQuote(mockLogger, config, request);

      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith(mockLogger, config, {
        fromAddress: request.payerAddress,
        pledgeAddress: request.receiverAddress,
        pledgeNum: 32000,
        extraTrxNum: "0",
        pledgeDay: "0",
        pledgeHour: "0",
        pledgeMinute: "10",
      });
    });

    it("rounds a duration past the hour windows up to whole days, capped at Tronify's 30", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({ pledgeNum: 32000 } as never);

      const quote = await getEnergyRentQuote(mockLogger, config, {
        ...request,
        durationSeconds: 40 * 86_400,
      });

      expect(quote.durationSeconds).toBe(30 * 86_400);
      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith(
        mockLogger,
        config,
        expect.objectContaining({ pledgeDay: "30", pledgeHour: "0", pledgeMinute: "0" }),
      );
    });

    it("rounds a sub-day duration past 3h up to a single day", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({ pledgeNum: 32000 } as never);

      const quote = await getEnergyRentQuote(mockLogger, config, {
        ...request,
        durationSeconds: 4 * 3600,
      });

      expect(quote.durationSeconds).toBe(86_400);
      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith(
        mockLogger,
        config,
        expect.objectContaining({ pledgeDay: "1", pledgeHour: "0", pledgeMinute: "0" }),
      );
    });

    it("forwards extraTrx as a string", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({ pledgeNum: 1 } as never);

      await getEnergyRentQuote(mockLogger, config, { ...request, extraTrx: 0.8 });

      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith(
        mockLogger,
        config,
        expect.objectContaining({ extraTrxNum: "0.8" }),
      );
    });
  });

  describe("craftEnergyRentTransaction", () => {
    it("returns the order id, unsigned transaction and payment amount", async () => {
      const transaction = {
        visible: false,
        txID: SIGNABLE_TX_ID,
        raw_data: {},
        raw_data_hex: SIGNABLE_RAW_DATA_HEX,
      };
      mockedAddTronRentRecord.mockResolvedValueOnce({
        orderId: "order-1",
        transaction,
        payCoinCode: "USDT",
        payCoinAmt: "3.12",
        purchaseEnergyFee: "3",
        purchaseTRXFee: "0",
        purchaseBandwidthFee: "0",
        activeAccountFee: "0",
      });

      const order = await craftEnergyRentTransaction(mockLogger, config, request);

      expect(order).toEqual({
        orderId: "order-1",
        transaction,
        payCoinCode: "USDT",
        payCoinAmt: "3.12",
      });
    });

    const orderCosting = (payCoinAmt: string, payCoinCode = "TRX") => ({
      orderId: "order-1",
      transaction: {
        visible: false,
        txID: SIGNABLE_TX_ID,
        raw_data: {},
        raw_data_hex: SIGNABLE_RAW_DATA_HEX,
      },
      payCoinCode,
      payCoinAmt,
      purchaseEnergyFee: "3",
      purchaseTRXFee: "0",
      purchaseBandwidthFee: "0",
      activeAccountFee: "0",
    });

    it("accepts an order at or under the approved ceiling", async () => {
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("12.50"));

      const order = await craftEnergyRentTransaction(mockLogger, config, {
        ...request,
        maxPayCoinAmt: "12.5",
        maxPayCoinCode: "TRX",
      });

      expect(order.payCoinAmt).toBe("12.50");
    });

    it("rejects an order priced above the approved ceiling", async () => {
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("99.9"));

      await expect(
        craftEnergyRentTransaction(mockLogger, config, {
          ...request,
          maxPayCoinAmt: "12.5",
          maxPayCoinCode: "TRX",
        }),
      ).rejects.toBeInstanceOf(TronifyApiError);
    });

    it("rejects an order priced in a different coin than was approved", async () => {
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0", "USDT"));

      await expect(
        craftEnergyRentTransaction(mockLogger, config, {
          ...request,
          maxPayCoinAmt: "12.5",
          maxPayCoinCode: "TRX",
        }),
      ).rejects.toBeInstanceOf(TronifyApiError);
    });

    it("rejects an order whose amount cannot be parsed", async () => {
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("not-a-number"));

      await expect(
        craftEnergyRentTransaction(mockLogger, config, {
          ...request,
          maxPayCoinAmt: "12.5",
          maxPayCoinCode: "TRX",
        }),
      ).rejects.toBeInstanceOf(TronifyApiError);
    });

    it("rejects a ceiling amount that carries no approved coin code", async () => {
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0", "USDT"));

      await expect(
        craftEnergyRentTransaction(mockLogger, config, { ...request, maxPayCoinAmt: "12.5" }),
      ).rejects.toBeInstanceOf(TronifyApiError);
    });

    it.each([
      ["a missing transaction", { ...orderCosting("1.0"), transaction: {} }],
      [
        "a non-hex raw_data_hex",
        {
          ...orderCosting("1.0"),
          transaction: { txID: "abc", raw_data: {}, raw_data_hex: "nothex" },
        },
      ],
      [
        "an empty txID",
        { ...orderCosting("1.0"), transaction: { txID: "", raw_data: {}, raw_data_hex: "abcd" } },
      ],
      [
        "a txID that does not match raw_data_hex",
        {
          ...orderCosting("1.0"),
          transaction: { txID: "abc", raw_data: {}, raw_data_hex: SIGNABLE_RAW_DATA_HEX },
        },
      ],
      [
        "a missing raw_data",
        {
          ...orderCosting("1.0"),
          transaction: { txID: SIGNABLE_TX_ID, raw_data_hex: SIGNABLE_RAW_DATA_HEX },
        },
      ],
      ["an empty orderId", { ...orderCosting("1.0"), orderId: "" }],
    ])("rejects an order with %s (no signable payment)", async (_label, malformed) => {
      mockedAddTronRentRecord.mockResolvedValueOnce(malformed as never);

      await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toBeInstanceOf(
        TronifyApiError,
      );
    });

    describe("signed-bytes verification", () => {
      it("accepts a native TRX TransferContract from the payer within the approved amount", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("12.50"));
        mockedDecodeTransaction.mockResolvedValueOnce(decodedTransfer({ amount: 12_500_000 }));

        await expect(
          craftEnergyRentTransaction(mockLogger, config, {
            ...request,
            maxPayCoinAmt: "12.5",
            maxPayCoinCode: "TRX",
          }),
        ).resolves.toMatchObject({ orderId: "order-1" });
      });

      it("rejects when the signed bytes are not a native TRX TransferContract", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTransfer({ type: "TriggerSmartContract" }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).rejects.toBeInstanceOf(TronifyApiError);
      });

      it("rejects when the signed bytes spend from a different owner than the payer", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTransfer({ owner_address: decode58Check(request.receiverAddress) }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).rejects.toBeInstanceOf(TronifyApiError);
      });

      it("rejects when the signed amount exceeds the approved cost", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(decodedTransfer({ amount: 1_000_001 }));

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).rejects.toBeInstanceOf(TronifyApiError);
      });

      it("rejects when the payment transaction cannot be decoded", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockRejectedValueOnce(new Error("bad protobuf"));

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).rejects.toBeInstanceOf(TronifyApiError);
      });
    });
  });

  describe("broadcastEnergyRentTransaction", () => {
    it("submits the signed payment via uploadHash using its txID as fromHash", async () => {
      mockedUploadHash.mockResolvedValueOnce({});
      const signedTransaction = {
        visible: false,
        txID: "abc",
        raw_data: {},
        raw_data_hex: "0x",
        signature: ["sig"],
      };

      await broadcastEnergyRentTransaction(mockLogger, config, {
        orderId: "order-1",
        signedTransaction,
      });

      expect(mockedUploadHash).toHaveBeenCalledWith(mockLogger, config, {
        orderId: "order-1",
        fromHash: "abc",
        signedData: signedTransaction,
      });
    });
  });

  describe("getEnergyRentStatus", () => {
    const respondWith = (orders: unknown[]) =>
      mockedMyPayOrder.mockResolvedValueOnce({
        data: orders,
        pagination: { page: 1, pageSize: 50, total: orders.length },
      } as never);

    const statusOf = (orderStatus: string) => {
      respondWith([purchaseOrder({ orderStatus })]);
      return getEnergyRentStatus(mockLogger, config, {
        orderId: "order-1",
        payerAddress: request.payerAddress,
      });
    };

    it("looks the order up by the payer address, requesting every order", async () => {
      respondWith([]);

      await getEnergyRentStatus(mockLogger, config, {
        orderId: "order-1",
        payerAddress: request.payerAddress,
      });

      expect(mockedMyPayOrder).toHaveBeenCalledWith(mockLogger, config, {
        fromAddress: request.payerAddress,
        orderType: "2",
        page: 1,
        pageSize: 50,
      });
    });

    it.each([
      ["wait_deposit_send", "pending"],
      ["wait_sale", "paid"],
      ["complete", "delivered"],
      ["timeout", "failed"],
    ])("maps Tronify orderStatus %s to %s", async (orderStatus, expected) => {
      expect(await statusOf(orderStatus)).toBe(expected);
    });

    it("returns 'unknown' when the order is not in the payer's records", async () => {
      respondWith([purchaseOrder({ orderId: "another-order" })]);

      const status = await getEnergyRentStatus(mockLogger, config, {
        orderId: "order-1",
        payerAddress: request.payerAddress,
      });

      expect(status).toBe("unknown");
    });

    it("returns 'unknown' for an unrecognised orderStatus", async () => {
      expect(await statusOf("some_new_status")).toBe("unknown");
    });
  });
});

describe("awaitEnergyDeliveryWith", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("resolves once status becomes delivered", async () => {
    const statuses = ["pending", "paid", "delivered"] as const;
    let i = 0;
    const p = awaitEnergyDeliveryWith(() => Promise.resolve(statuses[i++]), {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await jest.advanceTimersByTimeAsync(30);
    await expect(p).resolves.toBeUndefined();
  });

  test("throws EnergyDelegationTimeoutError past the deadline", async () => {
    const p = awaitEnergyDeliveryWith(() => Promise.resolve("pending"), {
      intervalMs: 10,
      timeoutMs: 50,
      paymentTxId: "tx",
    });
    const assertion = expect(p).rejects.toBeInstanceOf(EnergyDelegationTimeoutError);
    await jest.advanceTimersByTimeAsync(80);
    await assertion;
  });

  test("throws TronifyApiError when the order fails", async () => {
    const p = awaitEnergyDeliveryWith(() => Promise.resolve("failed"), {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await expect(p).rejects.toBeInstanceOf(TronifyApiError);
  });

  // The rental is paid for before polling starts, so a transient status failure must not abandon it.
  test("rides out transient status failures and still resolves on delivery", async () => {
    const outcomes: Array<() => Promise<EnergyRentStatus>> = [
      () => Promise.reject(new Error("503 Service Unavailable")),
      () => Promise.reject(new Error("503 Service Unavailable")),
      () => Promise.resolve("delivered"),
    ];
    let i = 0;
    const p = awaitEnergyDeliveryWith(() => outcomes[i++](), {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await jest.advanceTimersByTimeAsync(30);
    await expect(p).resolves.toBeUndefined();
  });

  // Exhaustion must not surface a raw error: that reaches DELIVERY_FAILED and re-crafts on retry
  // (double charge). This test locks it onto the uncertain-delivery timeout path instead (LIVE-32780 AC2).
  test("read exhaustion surfaces an uncertain-delivery timeout with the cause preserved", async () => {
    const cause = new Error("503 Service Unavailable");
    const p = awaitEnergyDeliveryWith(() => Promise.reject(cause), {
      intervalMs: 10,
      timeoutMs: 1000,
      paymentTxId: "tx-A-exhausted",
      maxConsecutiveErrors: 3,
    });
    const assertion = expect(p).rejects.toMatchObject({
      name: "EnergyDelegationTimeoutError",
      paymentTxId: "tx-A-exhausted",
      cause,
    });
    await jest.advanceTimersByTimeAsync(60);
    await assertion;
  });

  // Reset/unmount aborts the poll: it stops before any status read and throws EnergyDeliveryAbortedError
  // (not the timeout), so the caller drops the cycle without an on-chain reconciliation.
  test("a pre-aborted signal stops the poll before any status read", async () => {
    const controller = new AbortController();
    controller.abort();
    const getStatus = jest.fn<Promise<EnergyRentStatus>, []>().mockResolvedValue("pending");
    const p = awaitEnergyDeliveryWith(getStatus, {
      intervalMs: 10,
      timeoutMs: 1000,
      signal: controller.signal,
    });
    await expect(p).rejects.toBeInstanceOf(EnergyDeliveryAbortedError);
    expect(getStatus).not.toHaveBeenCalled();
  });

  test("aborting mid-poll stops further status reads", async () => {
    const controller = new AbortController();
    const getStatus = jest.fn<Promise<EnergyRentStatus>, []>().mockResolvedValue("pending");
    const p = awaitEnergyDeliveryWith(getStatus, {
      intervalMs: 10,
      timeoutMs: 10_000,
      signal: controller.signal,
    });
    const assertion = expect(p).rejects.toBeInstanceOf(EnergyDeliveryAbortedError);
    await jest.advanceTimersByTimeAsync(25);
    const callsBeforeAbort = getStatus.mock.calls.length;
    controller.abort();
    await jest.advanceTimersByTimeAsync(50);
    await assertion;
    expect(getStatus.mock.calls.length).toBeLessThanOrEqual(callsBeforeAbort + 1);
  });

  // The deadline is enforced even while a request is in flight: a hung request surfaces
  // EnergyDelegationTimeoutError instead of stranding the POLLING screen.
  test("times out while a status request is still in flight", async () => {
    const p = awaitEnergyDeliveryWith(() => new Promise<EnergyRentStatus>(() => {}), {
      intervalMs: 10,
      timeoutMs: 50,
      paymentTxId: "tx",
    });
    const assertion = expect(p).rejects.toBeInstanceOf(EnergyDelegationTimeoutError);
    await jest.advanceTimersByTimeAsync(80);
    await assertion;
  });
});

describe("awaitEnergyDelivery (on-chain gate)", () => {
  type NetInfo = Awaited<ReturnType<typeof getTronAccountNetwork>>;
  const netInfo = (energyLimit: number, energyUsed = 0): NetInfo =>
    ({
      family: "tron",
      freeNetUsed: new BigNumber(0),
      freeNetLimit: new BigNumber(0),
      netUsed: new BigNumber(0),
      netLimit: new BigNumber(0),
      energyUsed: new BigNumber(energyUsed),
      energyLimit: new BigNumber(energyLimit),
    }) as NetInfo;

  const providerStatus = (orderStatus: string) =>
    mockedMyPayOrder.mockResolvedValue({
      data: [purchaseOrder({ orderStatus })],
      pagination: { page: 1, pageSize: 50, total: 1 },
    } as never);

  const ref = { orderId: "order-1", payerAddress: request.payerAddress };
  const target = { receiverAddress: request.receiverAddress, energyNeeded: 1000n };
  const config = tronifyConfig();

  beforeEach(() => {
    jest.useFakeTimers();
    mockedGetTronAccountNetwork.mockReset();
    mockedMyPayOrder.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  test("resolves once the receiver's on-chain available energy covers energyNeeded", async () => {
    // Deficient, then the delegation lands and available (EnergyLimit − EnergyUsed) crosses the need.
    mockedGetTronAccountNetwork
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(200, 100)) // 100 available, still < 1000
      .mockResolvedValueOnce(netInfo(1200, 100)); // 1100 available ≥ 1000
    providerStatus("wait_sale"); // provider still "paid", not the gate
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await jest.advanceTimersByTimeAsync(30);
    await expect(p).resolves.toBeUndefined();
  });

  test("does NOT resolve on the provider reporting delivered — only the on-chain threshold releases TX-C", async () => {
    mockedGetTronAccountNetwork.mockResolvedValue(netInfo(100)); // 100 < 1000, forever
    providerStatus("complete"); // provider says delivered the whole time
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 50,
      paymentTxId: "txA",
    });
    const assertion = expect(p).rejects.toBeInstanceOf(EnergyDelegationTimeoutError);
    await jest.advanceTimersByTimeAsync(80);
    await assertion;
  });

  test("fails fast when the provider reports the order failed before energy lands", async () => {
    mockedGetTronAccountNetwork.mockResolvedValue(netInfo(0));
    providerStatus("timeout"); // maps to "failed"
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await expect(p).rejects.toBeInstanceOf(TronifyApiError);
  });

  test("skips the advisory provider call once energy is already on-chain", async () => {
    mockedGetTronAccountNetwork.mockResolvedValue(netInfo(5000)); // 5000 ≥ 1000 immediately
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await expect(p).resolves.toBeUndefined();
    expect(mockedMyPayOrder).not.toHaveBeenCalled();
  });

  test("a provider-status outage does not abort a delivery the on-chain read then confirms", async () => {
    // The provider throws on every poll — more than maxConsecutiveErrors in a row — while on-chain is
    // still deficient; the outage must degrade to pending, not burn the error budget, so the delivery
    // still resolves once the on-chain threshold is crossed.
    mockedGetTronAccountNetwork
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValue(netInfo(2000)); // ≥ 1000 from the 7th poll on
    mockedMyPayOrder.mockRejectedValue(new Error("provider status 503"));
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await jest.advanceTimersByTimeAsync(100);
    await expect(p).resolves.toBeUndefined();
  });
});

describe("isEnergyDeliveredOnChain (one-shot gate for reconcile paths)", () => {
  type NetInfo = Awaited<ReturnType<typeof getTronAccountNetwork>>;
  const netInfo = (energyLimit: number, energyUsed = 0): NetInfo =>
    ({
      family: "tron",
      freeNetUsed: new BigNumber(0),
      freeNetLimit: new BigNumber(0),
      netUsed: new BigNumber(0),
      netLimit: new BigNumber(0),
      energyUsed: new BigNumber(energyUsed),
      energyLimit: new BigNumber(energyLimit),
    }) as NetInfo;

  const target = { receiverAddress: request.receiverAddress, energyNeeded: 1000n };
  const config = tronifyConfig();

  beforeEach(() => mockedGetTronAccountNetwork.mockReset());

  test("true once available energy covers energyNeeded, false while it does not", async () => {
    mockedGetTronAccountNetwork.mockResolvedValueOnce(netInfo(1200, 100)); // 1100 available ≥ 1000
    await expect(isEnergyDeliveredOnChain(mockLogger, config, target)).resolves.toBe(true);
    mockedGetTronAccountNetwork.mockResolvedValueOnce(netInfo(900)); // 900 < 1000
    await expect(isEnergyDeliveredOnChain(mockLogger, config, target)).resolves.toBe(false);
  });
});

import coinConfig from "../../config";
import {
  addTronRentRecord,
  myPayOrder,
  queryPreorderInfo,
  uploadHash,
} from "../../network/tronify";
import { EnergyRentProviderNotConfigured } from "../../types/errors";
import {
  broadcastEnergyRentTransaction,
  craftEnergyRentTransaction,
  getEnergyProvider,
  getEnergyRentQuote,
  getEnergyRentStatus,
} from "./index";

jest.mock("../../network/tronify", () => ({
  queryPreorderInfo: jest.fn(),
  addTronRentRecord: jest.fn(),
  uploadHash: jest.fn(),
  myPayOrder: jest.fn(),
}));

const mockedQueryPreorderInfo = queryPreorderInfo as jest.MockedFunction<typeof queryPreorderInfo>;
const mockedAddTronRentRecord = addTronRentRecord as jest.MockedFunction<typeof addTronRentRecord>;
const mockedUploadHash = uploadHash as jest.MockedFunction<typeof uploadHash>;
const mockedMyPayOrder = myPayOrder as jest.MockedFunction<typeof myPayOrder>;

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

const enableTronify = () =>
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    explorer: { url: "https://tron.coin.ledger.com" },
    energyRent: {
      provider: "tronify",
      tronify: { url: "https://open.tronify.io", sourceFlag: "ll" },
    },
  }));

const request = {
  payerAddress: "TKghVbeEzvrV8GLK3YE1gRrjVHSf8rGB6k",
  receiverAddress: "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1",
  energy: 32000n,
  durationSeconds: 600,
};

describe("energyRent provider switch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    enableTronify();
  });

  describe("getEnergyProvider", () => {
    it("returns the tronify provider when selected", () => {
      expect(getEnergyProvider().id).toBe("tronify");
    });

    it("throws when no provider is configured", () => {
      coinConfig.setCoinConfig(() => ({
        status: { type: "active" },
        explorer: { url: "https://tron.coin.ledger.com" },
      }));
      expect(() => getEnergyProvider()).toThrow(EnergyRentProviderNotConfigured);
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

      const quote = await getEnergyRentQuote(request);

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
      const quote = await getEnergyRentQuote({ ...request, durationSeconds: 2 * 3600 });

      expect(quote.durationSeconds).toBe(3 * 3600);
      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith(
        expect.objectContaining({ pledgeDay: "0", pledgeHour: "3", pledgeMinute: "0" }),
      );
    });

    it("maps a 10-minute duration to the fastTrade window and defaults extraTrxNum to 0", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({ pledgeNum: 32000 } as never);

      await getEnergyRentQuote(request);

      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith({
        fromAddress: request.payerAddress,
        pledgeAddress: request.receiverAddress,
        pledgeNum: 32000,
        extraTrxNum: "0",
        pledgeDay: "0",
        pledgeHour: "0",
        pledgeMinute: "10",
      });
    });

    it("forwards extraTrx as a string", async () => {
      mockedQueryPreorderInfo.mockResolvedValueOnce({ pledgeNum: 1 } as never);

      await getEnergyRentQuote({ ...request, extraTrx: 0.8 });

      expect(mockedQueryPreorderInfo).toHaveBeenCalledWith(
        expect.objectContaining({ extraTrxNum: "0.8" }),
      );
    });
  });

  describe("craftEnergyRentTransaction", () => {
    it("returns the order id, unsigned transaction and payment amount", async () => {
      const transaction = { visible: false, txID: "abc", raw_data: {}, raw_data_hex: "0x" };
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

      const order = await craftEnergyRentTransaction(request);

      expect(order).toEqual({
        orderId: "order-1",
        transaction,
        payCoinCode: "USDT",
        payCoinAmt: "3.12",
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

      await broadcastEnergyRentTransaction({ orderId: "order-1", signedTransaction });

      expect(mockedUploadHash).toHaveBeenCalledWith({
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
      return getEnergyRentStatus({ orderId: "order-1", payerAddress: request.payerAddress });
    };

    it("looks the order up by the payer address, requesting every order", async () => {
      respondWith([]);

      await getEnergyRentStatus({ orderId: "order-1", payerAddress: request.payerAddress });

      expect(mockedMyPayOrder).toHaveBeenCalledWith({
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

      const status = await getEnergyRentStatus({
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

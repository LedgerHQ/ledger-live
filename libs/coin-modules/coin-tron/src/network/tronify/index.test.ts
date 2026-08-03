import network from "@ledgerhq/live-network";
import coinConfig from "../../config";
import { EnergyRentProviderNotConfigured } from "../../types/errors";
import { addTronRentRecord, myPayOrder, queryPreorderInfo, queryTrades, uploadHash } from "./index";
import type { TronifyEnergyOrderParams } from "./types";

jest.mock("@ledgerhq/live-network", () => ({ __esModule: true, default: jest.fn() }));

const mockedNetwork = network as jest.MockedFunction<typeof network>;

const TRONIFY_URL = "https://open.tronify.io";
const SOURCE_FLAG = "ledgerLive";

const setConfig = (tronify?: { url: string; sourceFlag: string; apiKey?: string }) =>
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    explorer: { url: "https://tron.coin.ledger.com" },
    energyRent: tronify ? { provider: "tronify", tronify } : undefined,
  }));

const envelope = <T>(data: T, resCode = 100, resMsg = "Success") => ({
  data: { resCode, resMsg, data },
});

const orderParams: TronifyEnergyOrderParams = {
  fromAddress: "TKghVbeEzvrV8GLK3YE1gRrjVHSf8rGB6k",
  pledgeAddress: "TKghVbeEzvrV8GLK3YE1gRrjVHSf8rGB6k",
  pledgeNum: 32000,
  pledgeDay: "0",
  pledgeHour: "0",
  pledgeMinute: "10",
  extraTrxNum: "0",
};

describe("tronify network client", () => {
  beforeEach(() => {
    mockedNetwork.mockReset();
    setConfig({ url: TRONIFY_URL, sourceFlag: SOURCE_FLAG });
  });

  it("rejects with EnergyRentProviderNotConfigured when energyRent is absent", async () => {
    setConfig(undefined);
    await expect(queryPreorderInfo(orderParams)).rejects.toBeInstanceOf(
      EnergyRentProviderNotConfigured,
    );
  });

  // The config type requires `tronify` alongside the provider id, but coin-config reaches us as
  // unvalidated remote JSON — hence the runtime guard this covers.
  it("rejects with EnergyRentProviderNotConfigured when remote config omits the tronify settings", async () => {
    coinConfig.setCoinConfig(
      () =>
        ({
          status: { type: "active" },
          explorer: { url: "https://tron.coin.ledger.com" },
          energyRent: { provider: "tronify" },
        }) as never,
    );

    await expect(queryPreorderInfo(orderParams)).rejects.toBeInstanceOf(
      EnergyRentProviderNotConfigured,
    );
  });

  describe("queryPreorderInfo", () => {
    it("POSTs to the endpoint with injected orderType/tradeType/sourceFlag and returns data", async () => {
      const data = { payCoinCode: "USDT", payCoinAmt: "3.12" };
      mockedNetwork.mockResolvedValueOnce(envelope(data) as never);

      const result = await queryPreorderInfo(orderParams);

      expect(result).toEqual(data);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${TRONIFY_URL}/api/tronRent/queryPreorderInfo`,
          data: expect.objectContaining({
            ...orderParams,
            orderType: "ENERGY",
            tradeType: "fastTrade",
            sourceFlag: SOURCE_FLAG,
          }),
        }),
      );
    });

    it("throws TronifyApiError carrying resCode on a non-100 response", async () => {
      mockedNetwork.mockResolvedValueOnce(
        envelope({}, 132, "pledgeNum cannot be less than 15000") as never,
      );

      await expect(queryPreorderInfo(orderParams)).rejects.toMatchObject({
        name: "TronifyApiError",
        resCode: 132,
      });
    });
  });

  describe("auth header", () => {
    it("sends the api-key header only when apiKey is configured", async () => {
      setConfig({ url: TRONIFY_URL, sourceFlag: SOURCE_FLAG, apiKey: "secret" });
      mockedNetwork.mockResolvedValueOnce(envelope({}) as never);

      await queryPreorderInfo(orderParams);

      expect(mockedNetwork.mock.calls[0][0]).toMatchObject({ headers: { apikey: "secret" } });
    });

    it("omits headers when no apiKey is configured", async () => {
      mockedNetwork.mockResolvedValueOnce(envelope({}) as never);

      await queryPreorderInfo(orderParams);

      expect(mockedNetwork.mock.calls[0][0]).not.toHaveProperty("headers");
    });
  });

  describe("addTronRentRecord", () => {
    it("returns the created order and unsigned transaction", async () => {
      const data = {
        orderId: "order-1",
        transaction: { visible: false, txID: "abc", raw_data: {}, raw_data_hex: "0x" },
        payCoinCode: "USDT",
        payCoinAmt: "3.12",
      };
      mockedNetwork.mockResolvedValueOnce(envelope(data) as never);

      const result = await addTronRentRecord(orderParams);

      expect(result).toEqual(data);
      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({ url: `${TRONIFY_URL}/api/tronRent/addTronRentRecord` }),
      );
    });
  });

  describe("uploadHash", () => {
    it("POSTs the signed payment without a sourceFlag", async () => {
      mockedNetwork.mockResolvedValueOnce(envelope({}) as never);
      const signedData = {
        visible: false,
        txID: "abc",
        raw_data: {},
        raw_data_hex: "0x",
        signature: ["sig"],
      };

      await uploadHash({ orderId: "order-1", fromHash: "abc", signedData });

      const body = mockedNetwork.mock.calls[0][0].data as Record<string, unknown>;
      expect(body).toEqual({ orderId: "order-1", fromHash: "abc", signedData });
      expect(body).not.toHaveProperty("sourceFlag");
    });
  });

  describe("queryTrades", () => {
    it("injects the sourceFlag into the request body", async () => {
      mockedNetwork.mockResolvedValueOnce(envelope({ data: [], pagination: {} }) as never);

      await queryTrades({ sort: "0", page: 1, pageSize: 10 });

      expect(mockedNetwork.mock.calls[0][0].data).toMatchObject({ sourceFlag: SOURCE_FLAG });
    });
  });

  describe("myPayOrder", () => {
    it("POSTs to mypayorder with the payer address and the sourceFlag", async () => {
      mockedNetwork.mockResolvedValueOnce(envelope({ data: [], pagination: {} }) as never);

      await myPayOrder({ fromAddress: "TKgh", orderType: "2", page: 1, pageSize: 50 });

      expect(mockedNetwork).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${TRONIFY_URL}/api/tronRent/mypayorder`,
          data: {
            fromAddress: "TKgh",
            orderType: "2",
            page: 1,
            pageSize: 50,
            sourceFlag: SOURCE_FLAG,
          },
        }),
      );
    });
  });
});

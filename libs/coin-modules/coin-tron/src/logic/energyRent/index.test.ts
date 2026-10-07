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
import { decodeTransaction, isCanonicalTriggerSmartContractTx } from "../utils";
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
  // Keep the real getTronifyConfig so the configuration gate is exercised for real.
  ...jest.requireActual("../../network/tronify"),
  queryPreorderInfo: jest.fn(),
  addTronRentRecord: jest.fn(),
  uploadHash: jest.fn(),
  myPayOrder: jest.fn(),
}));

// Mocked so tests can drive the decoded shape without constructing real TRON tx bytes.
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  decodeTransaction: jest.fn(),
  isCanonicalTriggerSmartContractTx: jest.fn(),
}));

// Stubbed to drive the energy the receiver holds mid-poll without hitting a node.
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
const mockedIsCanonical = jest.mocked(isCanonicalTriggerSmartContractTx);

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

// The first addresses Tronify's docs list; its payments go to each in turn.
const TRONIFY_PAYEES = [
  "TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx",
  "TPyiQrP19oaLu5bQcn1UJDuRqvZAJvYqjQ",
  "TWXcJPJhtdVWNiLRU5b4iVL2wJXdiJ3Bmj",
];

const tronifyConfig = (tronify: Record<string, unknown> = {}): TronCoinConfig =>
  ({
    status: { type: "active" },
    name: "Tron",
    unit: { name: "TRX", code: "TRX", magnitude: 6 },
    explorer: { url: "https://tron.coin.ledger.com" },
    energyRent: {
      provider: "tronify",
      tronify: {
        url: "https://open.tronify.io",
        sourceFlag: "ll",
        paymentAddresses: TRONIFY_PAYEES,
        ...tronify,
      },
    },
  }) as unknown as TronCoinConfig;

const request = {
  payerAddress: "TKghVbeEzvrV8GLK3YE1gRrjVHSf8rGB6k",
  receiverAddress: "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1",
  energy: 32000n,
  durationSeconds: 600,
  maxPayCoinAmt: "5",
  maxPayCoinCode: "USDT",
};

// A Tron txID is sha256(raw_data): hardcoded as a matching pair (not derived) so a wrong production
// hash breaks these fixtures instead of silently tracking it.
const SIGNABLE_RAW_DATA_HEX = "abcd";
const SIGNABLE_TX_ID = "123d4c7ef2d1600a1b3a0f6addc60a10f05a3495c9409f2ecbf4cc095d000a6b";

const USDT_CONTRACT_HEX = decode58Check("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t");
const RECIPIENT_HEX = decode58Check(TRONIFY_PAYEES[0]);
const UNLISTED_RECIPIENT_HEX = decode58Check(request.receiverAddress);
const TRON_ADDRESS_WORD = "0".repeat(22) + RECIPIENT_HEX;
const EVM_ADDRESS_WORD = "0".repeat(24) + RECIPIENT_HEX.slice(2);
const transferData = (amount: number, addressWord = TRON_ADDRESS_WORD) =>
  "a9059cbb" + addressWord + amount.toString(16).padStart(64, "0");
// What the default `orderCosting("1.0")` order charges, in USDT base units.
const ONE_USDT = 1_000_000;

const decodedTrc20Payment = ({
  type = "TriggerSmartContract",
  contracts = 1,
  fee_limit,
  expiration = Date.now() + 60_000,
  raw = {},
  Permission_id,
  ...value
}: {
  type?: string;
  contracts?: number;
  fee_limit?: number;
  expiration?: number | null;
  raw?: Record<string, unknown>;
  Permission_id?: number;
  owner_address?: string;
  contract_address?: string;
  data?: string;
  call_value?: number;
  call_token_value?: number;
  token_id?: number;
} = {}) => {
  const contract = {
    type,
    ...(Permission_id === undefined ? {} : { Permission_id }),
    parameter: {
      value: {
        owner_address: decode58Check(request.payerAddress),
        contract_address: USDT_CONTRACT_HEX,
        data: transferData(ONE_USDT),
        ...value,
      },
    },
  };
  return {
    txID: "abc",
    raw_data_hex: "abcd",
    raw_data: {
      contract: Array.from({ length: contracts }, () => contract),
      ...(fee_limit === undefined ? {} : { fee_limit }),
      ...(expiration === null ? {} : { expiration }),
      ...raw,
    },
  };
};

// Rent payments of real Tronify orders. Their txIDs are sha256(raw_data_hex).
const TRONIFY_PAYMENTS = [
  // Broadcast on 2026-06-05.
  {
    payer: "TYVnihygBiy6ZY4vYNzAcK9yMvAmYPhuVq",
    payee: TRONIFY_PAYEES[0],
    payCoinAmt: "3.32733",
    rawDataHex:
      "0a028ed022087280df3dd121c50c40b0b4cfd1e9335aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541f71b647cb5b87f7393217111d80a909c2f7e1650121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000029228e5d382b7a2c2a0dbc05e6d6507f4dbb3bbe000000000000000000000000000000000000000000000000000000000032c56270b092bac0e933900180c2d72f",
    txId: "26eea5f6072fdd5024596e2cbf9ea60653b996b813ab314eb8b66b44402caf80",
  },
  // Three unpaid orders built for the `ledger-live` sourceFlag on 2026-10-06, minutes apart: each
  // pays the next listed address.
  {
    payer: "TGZWHs5PSSkg5o1jEqBEGoVmKByKqko7NM",
    payee: TRONIFY_PAYEES[0],
    payCoinAmt: "3.21058",
    rawDataHex:
      "0a02b37a2208789ad66574cb328e40d09da79691345aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541484d54851263295961c3650e11e55f009425a4e7121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000029228e5d382b7a2c2a0dbc05e6d6507f4dbb3bbe000000000000000000000000000000000000000000000000000000000030fd5470c4b091969134900180c2d72f",
    txId: "9874858467647a4cc73fcc1f769f42772a6de8481d2b46a7a28ea3f88c49e283",
  },
  {
    payer: "TGZWHs5PSSkg5o1jEqBEGoVmKByKqko7NM",
    payee: TRONIFY_PAYEES[1],
    payCoinAmt: "3.21058",
    rawDataHex:
      "0a02b3b622080c75eb4b49588b4740f09bb29691345aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541484d54851263295961c3650e11e55f009425a4e7121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000099aa4fb789b27f45c9c5293260f922dda046014b000000000000000000000000000000000000000000000000000000000030fd5470b1a39c969134900180c2d72f",
    txId: "c7c3922745790834dc65ec03743b973986ae7c64fa2f6219620b02fdb07cd927",
  },
  {
    payer: "TGZWHs5PSSkg5o1jEqBEGoVmKByKqko7NM",
    payee: TRONIFY_PAYEES[2],
    payCoinAmt: "3.21058",
    rawDataHex:
      "0a02b4172208657134570083242540a8fdc39691345aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541484d54851263295961c3650e11e55f009425a4e7121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb000000000000000000000000e18346770a4409732b63e57abe70d347114e49bc000000000000000000000000000000000000000000000000000000000030fd5470ef88ae969134900180c2d72f",
    txId: "cf82b9d18d4572ffe9a16c5575426d0a3880063ebd80dedcfecf0ae98bb88a4a",
  },
];

// The June payment with an unknown field (99) appended, and re-encoded with a "hi" memo.
const JUNE_PAYMENT_PADDED = {
  rawDataHex: TRONIFY_PAYMENTS[0].rawDataHex + "9a060400000000",
  txId: "bcbef99ebbd6dc638c48668262196ffa77e8718eb59f502eff78cfcfed18e906",
};
const JUNE_PAYMENT_WITH_MEMO = {
  rawDataHex:
    "0a028ed022087280df3dd121c50c40b0b4cfd1e933520268695aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541f71b647cb5b87f7393217111d80a909c2f7e1650121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000029228e5d382b7a2c2a0dbc05e6d6507f4dbb3bbe000000000000000000000000000000000000000000000000000000000032c56270b092bac0e933900180c2d72f",
  txId: "4f4fccd124a0398402e445c8b89bf2c24c7ac562b53275abf0e6937c43ce6a2d",
};

// A protobuf-encoded USDT TX-A built locally from `request.payerAddress`: 3.2 USDT to an address
// Tronify does not list, in the TRON-form address word, fee_limit 50_000_000.
const USDT_PAYMENT_RAW_DATA_HEX =
  "0a02054a22089334553fd5c2cb624098abbfbfd4325aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a15416a91f86fc9b7e98b01a9d9141db61aed6f389b9e121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000004198927ffb9f554dc4a453c64b2e553a02d6df514b000000000000000000000000000000000000000000000000000000000030d400708de6bbbfd432900180e1eb17";
const USDT_PAYMENT_TX_ID = "14b7ff42f5c7092f81969cbee27a214bfd9de7ad1ff16acbfdc9471df5f90476";

describe("energyRent provider switch", () => {
  let config: TronCoinConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    // Drops a queued once-value a test left unconsumed by rejecting before reaching it.
    mockedAddTronRentRecord.mockReset();
    mockedDecodeTransaction.mockReset();
    mockedIsCanonical.mockReset();
    config = tronifyConfig();
    mockedDecodeTransaction.mockResolvedValue(decodedTrc20Payment());
    mockedIsCanonical.mockReturnValue(true);
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
      mockedDecodeTransaction.mockResolvedValueOnce(
        decodedTrc20Payment({ data: transferData(3_120_000) }),
      );

      const order = await craftEnergyRentTransaction(mockLogger, config, request);

      expect(order).toEqual({
        orderId: "order-1",
        transaction,
        payCoinCode: "USDT",
        payCoinAmt: "3.12",
      });
    });

    const orderCosting = (payCoinAmt: string, payCoinCode = "USDT") => ({
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
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("4.50"));
      mockedDecodeTransaction.mockResolvedValueOnce(
        decodedTrc20Payment({ data: transferData(4_500_000) }),
      );

      const order = await craftEnergyRentTransaction(mockLogger, config, {
        ...request,
        maxPayCoinAmt: "4.5",
      });

      expect(order.payCoinAmt).toBe("4.50");
    });

    it("rejects an order priced above the Review fee plus its margin", async () => {
      // 3.36 = 3.2 USDT on Review + 5%.
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("3.5"));

      await expect(
        craftEnergyRentTransaction(mockLogger, config, { ...request, maxPayCoinAmt: "3.36" }),
      ).rejects.toMatchObject({ name: "TronifyApiError", rule: "ceiling" });
    });

    it("rejects an order priced in a different coin than was approved", async () => {
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0", "TRX"));

      await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject({
        name: "TronifyApiError",
        rule: "payCoin",
      });
    });

    it("rejects an order whose amount cannot be parsed", async () => {
      mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("not-a-number"));

      await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject({
        name: "TronifyApiError",
        rule: "ceiling",
      });
    });

    it.each([
      ["no ceiling", { maxPayCoinAmt: undefined }],
      ["a ceiling without a coin code", { maxPayCoinCode: undefined }],
      ["an unparseable ceiling", { maxPayCoinAmt: "not-a-number" }],
    ])("rejects a request carrying %s before ordering", async (_label, ceiling) => {
      await expect(
        craftEnergyRentTransaction(mockLogger, config, { ...request, ...ceiling }),
      ).rejects.toMatchObject({ name: "TronifyApiError", rule: "ceiling" });
      expect(mockedAddTronRentRecord).not.toHaveBeenCalled();
    });

    it.each([
      ["missing", undefined],
      ["empty", []],
      ["holding an invalid address", [...TRONIFY_PAYEES, "not-an-address"]],
      ["holding a non-TRON address", [...TRONIFY_PAYEES, "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]],
    ])("refuses to order while the payment addresses are %s", async (_label, paymentAddresses) => {
      await expect(
        craftEnergyRentTransaction(mockLogger, tronifyConfig({ paymentAddresses }), request),
      ).rejects.toBeInstanceOf(EnergyRentProviderNotConfigured);
      expect(mockedAddTronRentRecord).not.toHaveBeenCalled();
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
      ["no orderId", { ...orderCosting("1.0"), orderId: undefined }],
    ])("rejects an order with %s (no signable payment)", async (_label, malformed) => {
      mockedAddTronRentRecord.mockResolvedValueOnce(malformed as never);

      await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject({
        name: "TronifyApiError",
        rule: "signableOrder",
      });
    });

    describe("signed-bytes verification", () => {
      const approvedUsdt = { ...request, maxPayCoinAmt: "4.5" };

      it.each([
        ["the TRON (41) address-word form", TRON_ADDRESS_WORD],
        ["the EVM (00) address-word form", EVM_ADDRESS_WORD],
      ])(
        "accepts a USDT transfer from the payer within the approved amount, in %s",
        async (_label, addressWord) => {
          mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("4.50"));
          mockedDecodeTransaction.mockResolvedValueOnce(
            decodedTrc20Payment({ data: transferData(4_500_000, addressWord) }),
          );

          await expect(
            craftEnergyRentTransaction(mockLogger, config, approvedUsdt),
          ).resolves.toMatchObject({ orderId: "order-1" });
        },
      );

      it("accepts the 100 TRX fee_limit Tronify builds its payments with", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ fee_limit: 100_000_000 }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).resolves.toMatchObject({
          orderId: "order-1",
        });
      });

      it("accepts an expiration a few minutes out, inside the accepted window", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ expiration: Date.now() + 6 * 60_000 }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).resolves.toMatchObject({ orderId: "order-1" });
      });

      it.each([
        ["the next whole base unit", 3_124_528],
        ["the whole base unit below", 3_124_527],
      ])("accepts a sub-unit quote paid as %s", async (_label, paid) => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("3.1245271"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ data: transferData(paid) }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).resolves.toMatchObject({
          orderId: "order-1",
        });
      });

      it("rejects a sub-unit quote paid two base units short", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("3.1245271"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ data: transferData(3_124_526) }),
        );

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject(
          { name: "TronifyApiError", rule: "amount" },
        );
      });

      it("rejects an order that charges nothing, even when the payment matches it", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("0"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ data: transferData(0) }),
        );

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject(
          { name: "TronifyApiError", rule: "amount" },
        );
      });

      // Each payment's own expiration is long past: judge it from a minute before then.
      const craftReal = async (
        rawDataHex: string,
        txID: string,
        payCoinAmt: string,
        payerAddress: string,
      ) => {
        const realUtils = jest.requireActual<typeof import("../utils")>("../utils");
        const { raw_data } = await realUtils.decodeTransaction(rawDataHex);
        const now = jest.spyOn(Date, "now").mockReturnValue(Number(raw_data.expiration) - 60_000);
        mockedAddTronRentRecord.mockResolvedValueOnce({
          ...orderCosting(payCoinAmt),
          transaction: { visible: false, txID, raw_data: {}, raw_data_hex: rawDataHex },
        });
        mockedDecodeTransaction.mockImplementationOnce(realUtils.decodeTransaction);
        mockedIsCanonical.mockImplementationOnce(realUtils.isCanonicalTriggerSmartContractTx);
        try {
          return await craftEnergyRentTransaction(mockLogger, config, {
            ...request,
            payerAddress,
            maxPayCoinAmt: "3.37",
          });
        } finally {
          now.mockRestore();
        }
      };

      it.each(
        TRONIFY_PAYMENTS.map(
          payment => [payment.payee, payment.txId.slice(0, 8), payment] as const,
        ),
      )(
        "accepts a real Tronify payment to %s (tx %s)",
        async (_payee, _txId, { rawDataHex, txId, payCoinAmt, payer }) => {
          await expect(craftReal(rawDataHex, txId, payCoinAmt, payer)).resolves.toMatchObject({
            orderId: "order-1",
          });
        },
      );

      it("rejects a real protobuf-encoded payment to an address Tronify does not list", async () => {
        await expect(
          craftReal(USDT_PAYMENT_RAW_DATA_HEX, USDT_PAYMENT_TX_ID, "3.2", request.payerAddress),
        ).rejects.toMatchObject({ name: "TronifyApiError", rule: "payee" });
      });

      it.each([
        ["bytes the decoder does not read", JUNE_PAYMENT_PADDED, "encoding"],
        ["a memo", JUNE_PAYMENT_WITH_MEMO, "memo"],
      ])("rejects a real payment carrying %s", async (_label, { rawDataHex, txId }, rule) => {
        const { payer, payCoinAmt } = TRONIFY_PAYMENTS[0];

        await expect(craftReal(rawDataHex, txId, payCoinAmt, payer)).rejects.toMatchObject({
          name: "TronifyApiError",
          rule,
        });
      });

      it("accepts an unset memo and the owner permission", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ raw: { data: "", scripts: "", auths: [] }, Permission_id: 0 }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, request),
        ).resolves.toMatchObject({ orderId: "order-1" });
      });

      it("rejects a payment above the 10 USDT cap, even within an approved ceiling", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("10.5"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ data: transferData(10_500_000) }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, { ...request, maxPayCoinAmt: "11" }),
        ).rejects.toMatchObject({ name: "TronifyApiError", rule: "cap" });
      });

      it("accepts a payment of exactly the 10 USDT cap", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("10"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({ data: transferData(10_000_000) }),
        );

        await expect(
          craftEnergyRentTransaction(mockLogger, config, { ...request, maxPayCoinAmt: "10" }),
        ).resolves.toMatchObject({ orderId: "order-1" });
      });

      it("applies the cap from coin-config", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(decodedTrc20Payment());

        await expect(
          craftEnergyRentTransaction(mockLogger, tronifyConfig({ maxRentAmount: 0.5 }), request),
        ).rejects.toMatchObject({ name: "TronifyApiError", rule: "cap" });
      });

      it("logs the failed rule and order id, and no address", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(
          decodedTrc20Payment({
            data: transferData(ONE_USDT, "0".repeat(22) + UNLISTED_RECIPIENT_HEX),
          }),
        );

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toThrow(
          "Energy-rent payment goes to an address Tronify does not list",
        );
        expect(mockLogger).toHaveBeenCalledWith(
          "tron/energyRent",
          "rent payment rejected before signing",
          { rule: "payee", orderId: "order-1" },
        );
      });

      it("logs an unsignable order with the order id Tronify returned", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce({
          ...orderCosting("1.0"),
          transaction: { txID: "abc", raw_data: {}, raw_data_hex: SIGNABLE_RAW_DATA_HEX },
        } as never);

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toThrow(
          "Tronify returned an energy-rent order missing a signable transaction",
        );
        expect(mockLogger).toHaveBeenCalledWith(
          "tron/energyRent",
          "rent payment rejected before signing",
          { rule: "signableOrder", orderId: "order-1" },
        );
      });

      it.each([
        ["an error code", new TronifyApiError("Parameter error", { resCode: 114 })],
        ["a network error", new Error("socket hang up")],
      ])(
        "does not log a Tronify call failing with %s as a rejected payment",
        async (_label, error) => {
          mockedAddTronRentRecord.mockRejectedValueOnce(error);

          await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toThrow(
            error.message,
          );
          expect(mockLogger).not.toHaveBeenCalled();
        },
      );

      it("rejects decoded bytes carrying no contract list", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce({
          txID: "abc",
          raw_data_hex: SIGNABLE_RAW_DATA_HEX,
          raw_data: { expiration: Date.now() + 60_000 },
        });

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject(
          { name: "TronifyApiError", rule: "shape" },
        );
      });

      it.each([
        [
          "a native TRX TransferContract",
          "shape",
          decodedTrc20Payment({ type: "TransferContract" }),
        ],
        ["two contracts", "shape", decodedTrc20Payment({ contracts: 2 })],
        [
          "a different owner than the payer",
          "owner",
          decodedTrc20Payment({ owner_address: decode58Check(request.receiverAddress) }),
        ],
        [
          "a contract other than USDT",
          "contract",
          decodedTrc20Payment({
            contract_address: decode58Check("TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8"),
          }),
        ],
        ["a TRX call_value", "callValue", decodedTrc20Payment({ call_value: 1 })],
        ["a TRC-10 call_token_value", "callValue", decodedTrc20Payment({ call_token_value: 1 })],
        ["a TRC-10 token_id", "callValue", decodedTrc20Payment({ token_id: 1_002_000 })],
        [
          "an approve() selector",
          "transferCall",
          decodedTrc20Payment({ data: "095ea7b3" + transferData(ONE_USDT).slice(8) }),
        ],
        [
          "trailing bytes after the amount word",
          "transferCall",
          decodedTrc20Payment({ data: transferData(ONE_USDT) + "00" }),
        ],
        [
          "non-zero address padding",
          "transferCall",
          decodedTrc20Payment({
            data: "a9059cbb" + "01" + TRON_ADDRESS_WORD.slice(2) + transferData(ONE_USDT).slice(72),
          }),
        ],
        [
          "an address word prefixed 42",
          "transferCall",
          decodedTrc20Payment({
            data:
              "a9059cbb" +
              "0".repeat(22) +
              "42" +
              RECIPIENT_HEX.slice(2) +
              transferData(ONE_USDT).slice(72),
          }),
        ],
        ["no call data", "transferCall", decodedTrc20Payment({ data: "" })],
        [
          "a fee_limit above the 100 TRX bound",
          "feeLimit",
          decodedTrc20Payment({ fee_limit: 100_000_001 }),
        ],
        [
          "an amount above the approved order",
          "amount",
          decodedTrc20Payment({ data: transferData(ONE_USDT + 1) }),
        ],
        [
          "an amount below the approved order",
          "amount",
          decodedTrc20Payment({ data: transferData(ONE_USDT - 1) }),
        ],
        ["a zero amount", "amount", decodedTrc20Payment({ data: transferData(0) })],
        [
          "an expiration a day out, long enough to be held past a retry",
          "expiration",
          decodedTrc20Payment({ expiration: Date.now() + 24 * 60 * 60_000 }),
        ],
        ["no expiration", "expiration", decodedTrc20Payment({ expiration: null })],
        [
          "an expiration already past",
          "expiration",
          decodedTrc20Payment({ expiration: Date.now() - 1_000 }),
        ],
        ["a non-finite expiration", "expiration", decodedTrc20Payment({ expiration: Number.NaN })],
      ])("rejects signed bytes carrying %s (rule %s)", async (_label, rule, decoded) => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(decoded);

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject(
          { name: "TronifyApiError", rule },
        );
      });

      it.each([
        [
          "a recipient Tronify does not list",
          "payee",
          decodedTrc20Payment({
            data: transferData(ONE_USDT, "0".repeat(22) + UNLISTED_RECIPIENT_HEX),
          }),
        ],
        ["a memo", "memo", decodedTrc20Payment({ raw: { data: new Uint8Array([0x68, 0x69]) } })],
        ["scripts", "scripts", decodedTrc20Payment({ raw: { scripts: new Uint8Array([0x01]) } })],
        [
          "authorities",
          "auths",
          decodedTrc20Payment({ raw: { auths: [{ permissionName: "active" }] } }),
        ],
        ["a non-owner permission", "permission", decodedTrc20Payment({ Permission_id: 2 })],
      ])("rejects signed bytes carrying %s (rule %s)", async (_label, rule, decoded) => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockResolvedValueOnce(decoded);

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject(
          { name: "TronifyApiError", rule },
        );
      });

      it("rejects a TRX-priced order even when the caller approved TRX", async () => {
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0", "TRX"));

        await expect(
          craftEnergyRentTransaction(mockLogger, config, { ...request, maxPayCoinCode: "TRX" }),
        ).rejects.toMatchObject({ name: "TronifyApiError", rule: "payCoin" });
      });

      it("rejects when the payment transaction cannot be decoded, keeping the decoder's error", async () => {
        const decodeError = new Error("bad protobuf");
        mockedAddTronRentRecord.mockResolvedValueOnce(orderCosting("1.0"));
        mockedDecodeTransaction.mockRejectedValueOnce(decodeError);

        await expect(craftEnergyRentTransaction(mockLogger, config, request)).rejects.toMatchObject(
          { name: "TronifyApiError", rule: "decode", cause: decodeError },
        );
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

  test("tolerates exactly maxConsecutiveErrors failures in a row", async () => {
    const outcomes: Array<() => Promise<EnergyRentStatus>> = [
      () => Promise.reject(new Error("503 Service Unavailable")),
      () => Promise.reject(new Error("503 Service Unavailable")),
      () => Promise.resolve("delivered"),
    ];
    let i = 0;
    const p = awaitEnergyDeliveryWith(() => outcomes[i++](), {
      intervalMs: 10,
      timeoutMs: 1000,
      maxConsecutiveErrors: 2,
    });
    await jest.advanceTimersByTimeAsync(30);
    await expect(p).resolves.toBeUndefined();
  });

  test("read exhaustion surfaces a timeout (not DELIVERY_FAILED, which would double-charge a retry), cause preserved", async () => {
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
    mockedGetTronAccountNetwork
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(200, 100))
      .mockResolvedValueOnce(netInfo(1200, 100));
    providerStatus("wait_sale");
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await jest.advanceTimersByTimeAsync(30);
    await expect(p).resolves.toBeUndefined();
  });

  test("does NOT resolve on the provider reporting delivered — only the on-chain threshold releases TX-C", async () => {
    mockedGetTronAccountNetwork.mockResolvedValue(netInfo(100));
    providerStatus("complete");
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
    providerStatus("timeout");
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await expect(p).rejects.toBeInstanceOf(TronifyApiError);
  });

  test("skips the advisory provider call once energy is already on-chain", async () => {
    mockedGetTronAccountNetwork.mockResolvedValue(netInfo(5000));
    const p = awaitEnergyDelivery(mockLogger, config, ref, target, {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    await expect(p).resolves.toBeUndefined();
    expect(mockedMyPayOrder).not.toHaveBeenCalled();
  });

  test("a provider-status outage does not abort a delivery the on-chain read then confirms", async () => {
    mockedGetTronAccountNetwork
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValueOnce(netInfo(0))
      .mockResolvedValue(netInfo(2000));
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
    mockedGetTronAccountNetwork.mockResolvedValueOnce(netInfo(1200, 100));
    await expect(isEnergyDeliveredOnChain(mockLogger, config, target)).resolves.toBe(true);
    mockedGetTronAccountNetwork.mockResolvedValueOnce(netInfo(900));
    await expect(isEnergyDeliveredOnChain(mockLogger, config, target)).resolves.toBe(false);
  });
});

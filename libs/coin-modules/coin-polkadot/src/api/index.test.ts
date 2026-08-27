import type {
  AssetInfo,
  BalanceOptions,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { TypeRegistry, type GenericExtrinsic } from "@polkadot/types";
import type { AnyTuple } from "@polkadot/types/types";
import type { CoreTransaction } from "../types";
import { createMockPolkadotContext, polkadotMainnetConfigValue } from "../test/config.fixture";
import { createApi } from ".";

const context = createMockPolkadotContext();

// Module-level mocks for logic functions that need to be spied on
const mockBroadcast = jest.fn();
const mockCraftTransaction = jest.fn();
const mockEstimateFees = jest.fn();
const mockCraftEstimationTransaction = jest.fn();
const mockListOperations = jest.fn();

jest.mock("../logic", () => ({
  ...jest.requireActual("../logic"),
  broadcast: (...args: unknown[]) => mockBroadcast(...args),
  craftTransaction: (...args: unknown[]) => mockCraftTransaction(...args),
  estimateFees: (...args: unknown[]) => mockEstimateFees(...args),
  craftEstimationTransaction: (...args: unknown[]) => mockCraftEstimationTransaction(...args),
  listOperations: (...args: unknown[]) => mockListOperations(...args),
}));

function generateApi() {
  return createApi();
}

describe("index", () => {
  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(generateApi(), context)).resolves.toEqual({
      unsupported: [
        "call",
        "craftRawTransaction",
        "getBlock",
        "getBlockInfo",
        "getNextSequence",
        "getRewards",
        "getStakes",
        "getValidators",
        "register",
        "validateIntent",
      ],
      inconsistent: [],
    });
  });
  describe("createApi", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("declares every method the chain supports", () => {
      const api = generateApi();
      expect(api).toEqual({
        broadcast: expect.any(Function),
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: expect.any(Function),
        listOperations: expect.any(Function),
        validateAddress: expect.any(Function),
        craftTransactionData: expect.any(Function),
        lastBlock: expect.any(Function),
      });
    });
  });

  describe("combine", () => {
    it.each([undefined, ""])("should throw an error when pubkey is %s", pubkey => {
      const api = generateApi();
      expect(() =>
        api.combine(context, "", [""], pubkey === undefined ? undefined : { pubkey }),
      ).toThrow("UnsupportedMethod");
    });
  });

  describe("broadcast", () => {
    it("should broadcast a transaction using broadcast from logic", async () => {
      const api = generateApi();

      mockBroadcast.mockResolvedValueOnce("");

      const transaction = "some random string";
      await api.broadcast(context, transaction);

      expect(mockBroadcast).toHaveBeenCalledTimes(1);
      expect(mockBroadcast).toHaveBeenCalledWith(
        polkadotMainnetConfigValue,
        transaction,
        "polkadot",
      );
    });
  });

  describe("craftTransaction", () => {
    it("should craft a transaction", async () => {
      const api = generateApi();

      const intent = {
        amount: 456717762531n,
        recipient: "12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS",
      } as TransactionIntent;

      const extrinsic = {
        toHex: () => "0x1234",
      } as unknown as GenericExtrinsic<AnyTuple>;

      const registry = new TypeRegistry();
      jest.spyOn(registry, "createType").mockReturnValue(extrinsic);
      mockCraftTransaction.mockResolvedValue({
        unsigned: {
          version: 0,
        },
        registry,
      } as CoreTransaction);

      const tx = await api.craftTransaction(context, intent);
      expect(tx).toEqual({ transaction: extrinsic.toHex() });
    });
  });

  describe("estimateFees", () => {
    it("should estimate fees", async () => {
      const api = generateApi();

      const intent = {
        amount: 456717762531n,
        sender: "12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS",
      } as TransactionIntent;

      const fees = 1n;
      mockEstimateFees.mockResolvedValue(fees);

      mockCraftEstimationTransaction.mockResolvedValue({} as CoreTransaction);

      const feeEstimation = await api.estimateFees(context, intent);
      expect(feeEstimation.value).toEqual(fees);
    });
  });

  describe("listOperations", () => {
    it("should return operations", async () => {
      const api = generateApi();

      mockListOperations.mockResolvedValue([[], 2]);
      const result = await api.listOperations(context, "some random address", { minHeight: 0 });
      expect(result).toEqual({ items: [], next: "2" });
    });
  });

  describe("getBalance", () => {
    it.each([
      {
        title: "empty object",
        options: {} as unknown as BalanceOptions,
      },
      {
        title: "regular object",
        options: {
          includeAssets: (_assetInfo: AssetInfo) => true,
        } as unknown as BalanceOptions,
      },
    ])("should throw an exception when options is provided as $title", async ({ options }) => {
      const api = generateApi();
      await expect(api.getBalance(context, "random address", options)).rejects.toMatchObject({
        name: "InvalidParameterError",
      });
    });
  });
});

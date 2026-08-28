import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { getBalance } from "../logic/getBalance";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { broadcast } from "../logic/broadcast";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { validateIntent } from "../logic/validateIntent";
import { createMockNearContext } from "../test/context";
import { createApi } from "./index";

jest.mock("../logic/getBalance", () => ({ getBalance: jest.fn() }));
jest.mock("../logic/getBlockInfo", () => ({ getBlockInfo: jest.fn() }));
jest.mock("../logic/lastBlock", () => ({ lastBlock: jest.fn() }));
jest.mock("../logic/listOperations", () => ({ listOperations: jest.fn() }));
jest.mock("../logic/getStakes", () => ({ getStakes: jest.fn() }));
jest.mock("../logic/getValidators", () => ({ getValidators: jest.fn() }));
jest.mock("../logic/broadcast", () => ({ broadcast: jest.fn() }));
jest.mock("../logic/craftTransaction", () => ({ craftTransaction: jest.fn() }));
jest.mock("../logic/estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../logic/validateIntent", () => ({ validateIntent: jest.fn() }));

describe("createApi", () => {
  // The consumer resolver hands the module to callers through `withDefaults`, so exercise the API
  // the way a consumer sees it: the capabilities NEAR omits are backfilled by the framework.
  const api = withDefaults(createApi());
  const context = createMockNearContext();

  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  //
  // Kept out rather than stubbed: NEAR's nonce belongs to an access key rather than to an
  // account, a staking pool compounds rewards into the staked balance instead of emitting
  // distribution events, and the module exposes neither a full-block read, an externally-built
  // transaction, a contract-call escape hatch nor an enrollment step.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(createApi(), context)).resolves.toEqual({
      unsupported: [
        "call",
        "craftRawTransaction",
        "getBlock",
        "getNextSequence",
        "getRewards",
        "register",
      ],
      inconsistent: [],
    });
  });
  it("declares every method the chain supports", () => {
    const methods = [
      "lastBlock",
      "getBlockInfo",
      "getValidators",
      "getBalance",
      "listOperations",
      "getStakes",
      "craftTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "validateIntent",
      "validateAddress",
      "craftTransactionData",
    ];

    for (const method of methods) {
      expect(typeof api[method as keyof typeof api]).toBe("function");
    }
  });

  describe("delegates each method to its implementation", () => {
    const intent = { intentType: "transaction", sender: "sender.near" } as never;

    beforeEach(() => jest.clearAllMocks());

    it("forwards the read methods", async () => {
      await api.lastBlock(context);
      expect(lastBlock).toHaveBeenCalled();

      await api.getBlockInfo(context, 42);
      expect(getBlockInfo).toHaveBeenCalledWith(context, 42);

      await api.listOperations(context, "sender.near", { minHeight: 7 });
      expect(listOperations).toHaveBeenCalledWith(context, "sender.near", { minHeight: 7 });

      await api.getStakes(context, "sender.near", { cursor: "cursor" });
      expect(getStakes).toHaveBeenCalledWith(context, "sender.near", "cursor");

      await api.getValidators(context, { cursor: "cursor" });
      expect(getValidators).toHaveBeenCalledWith(context, "cursor");
    });

    it("forwards getBalance and rejects unsupported balance options", async () => {
      (getBalance as jest.Mock).mockResolvedValue([]);

      await api.getBalance(context, "sender.near");
      expect(getBalance).toHaveBeenCalledWith(context, "sender.near");

      await expect(
        api.getBalance(context, "sender.near", { includeAssets: async () => true }),
      ).rejects.toThrow("getBalance does not support the options parameter");
    });

    it("forwards the transaction lifecycle methods", async () => {
      const fees = { value: 1n };

      await api.craftTransaction(context, intent, { customFees: fees });
      expect(craftTransaction).toHaveBeenCalledWith(context, intent, fees);

      await api.estimateFees(context, intent, { customFeesParameters: { gasPrice: "1" } });
      expect(estimateFees).toHaveBeenCalledWith(context, intent, { gasPrice: "1" });

      await api.broadcast(context, "signed-tx");
      expect(broadcast).toHaveBeenCalledWith(context, "signed-tx", undefined);

      await api.validateIntent(context, intent, [], { customFees: fees });
      expect(validateIntent).toHaveBeenCalledWith(context, intent, [], fees);
    });
  });

  it("validates an address format on the spot", async () => {
    await expect(api.validateAddress(context, "recipient.near", {})).resolves.toBe(true);
    await expect(api.validateAddress(context, "NOT VALID", {})).resolves.toBe(false);
  });
});

import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getBlockInfo } from "../logic/getBlockInfo";
import { getNextSequence } from "../logic/getNextSequence";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";
import { createMockTonContext } from "../test/context";
import { OWNER } from "../test/history.fixtures";
import { createApi } from "./index";

jest.mock("../logic/broadcast", () => ({ broadcast: jest.fn() }));
jest.mock("../logic/combine", () => ({ combine: jest.fn() }));
jest.mock("../logic/craftTransaction", () => ({ craftTransaction: jest.fn() }));
jest.mock("../logic/estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../logic/getBalance", () => ({ getBalance: jest.fn() }));
jest.mock("../logic/getBlockInfo", () => ({ getBlockInfo: jest.fn() }));
jest.mock("../logic/getNextSequence", () => ({ getNextSequence: jest.fn() }));
jest.mock("../logic/lastBlock", () => ({ lastBlock: jest.fn() }));
jest.mock("../logic/listOperations", () => ({ listOperations: jest.fn() }));
jest.mock("../logic/validateIntent", () => ({ validateIntent: jest.fn() }));

describe("createApi", () => {
  const api = withDefaults(createApi());
  const context = createMockTonContext();

  beforeEach(() => jest.clearAllMocks());

  it("omits the capabilities TON does not expose", async () => {
    await expect(capabilityReport(createApi(), context)).resolves.toEqual({
      unsupported: [
        "call",
        "craftRawTransaction",
        "getBlock",
        "getRewards",
        "getStakes",
        "getValidators",
        "register",
      ],
      inconsistent: [],
    });
  });

  it("forwards the read methods with the context", async () => {
    await api.lastBlock(context);
    expect(lastBlock).toHaveBeenCalledWith(context);

    await api.getBlockInfo(context, 42);
    expect(getBlockInfo).toHaveBeenCalledWith(context, 42);

    await api.listOperations(context, OWNER, { minHeight: 7, cursor: "1725542692" });
    expect(listOperations).toHaveBeenCalledWith(context, OWNER, {
      minHeight: 7,
      cursor: "1725542692",
    });

    await api.getNextSequence(context, OWNER);
    expect(getNextSequence).toHaveBeenCalledWith(context, OWNER);
  });

  it("forwards getBalance and rejects balance options", async () => {
    jest.mocked(getBalance).mockResolvedValue([]);

    await api.getBalance(context, OWNER);
    expect(getBalance).toHaveBeenCalledWith(context, OWNER);

    await expect(
      api.getBalance(context, OWNER, { includeAssets: async () => true }),
    ).rejects.toThrow("getBalance does not support the options parameter");
  });

  it("validates an address on the spot", async () => {
    await expect(api.validateAddress(context, OWNER, {})).resolves.toBe(true);
    await expect(api.validateAddress(context, "not a TON address", {})).resolves.toBe(false);
  });

  it("forwards the transaction lifecycle methods, passing fees to validateIntent only", async () => {
    const intent = { intentType: "transaction", sender: OWNER } as never;

    await api.craftTransaction(context, intent, { customFees: { value: 1n } });
    expect(craftTransaction).toHaveBeenCalledWith(context, intent);

    await api.estimateFees(context, intent, { customFeesParameters: { gas: 1 } });
    expect(estimateFees).toHaveBeenCalledWith(context, intent);

    api.combine(context, "body", ["signature"], { pubkey: "key" });
    expect(combine).toHaveBeenCalledWith("body", ["signature"], "key");

    await api.broadcast(context, "message");
    expect(broadcast).toHaveBeenCalledWith(context, "message");

    await api.validateIntent(context, intent, [], { customFees: { value: 1n } });
    expect(validateIntent).toHaveBeenCalledWith(context, intent, [], { value: 1n });
  });
});

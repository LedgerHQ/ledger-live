import { withDefaults } from "@ledgerhq/coin-module-framework/api/withDefaults";
import { createApi } from "./index";
import * as getBalanceModule from "../logic/getBalance";
import { broadcast } from "../logic/broadcast";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { combine } from "../logic/combine";
import { validateIntent } from "../logic/validateIntent";
import { validateAddress } from "../logic/validateAddress";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { BitcoinContext } from "./config";

// Contract-level test of the Alpaca surface. Deliberately a `.test.ts` (hermetic unit), NOT
// `.integ.test.ts`: asserting the wiring — required methods present, account-inapplicable methods
// answered "not supported" by `withDefaults`, and the gap-#1 `derivationPath` thread — needs no
// network. The craft → combine → signed-tx flow is exercised end-to-end by the co-located logic
// tests (craftTransaction / combine) and, against real funds, by coin-tester.

jest.mock("../logic/getBalance");
jest.mock("../logic/broadcast");
jest.mock("../logic/lastBlock");
jest.mock("../logic/listOperations");
jest.mock("../logic/craftTransaction");
jest.mock("../logic/estimateFees");
jest.mock("../logic/combine");
jest.mock("../logic/validateIntent");
jest.mock("../logic/validateAddress");
jest.mock("@ledgerhq/coin-module-framework/logic/craftTransactionData");

const ctx = {} as unknown as BitcoinContext;

describe("api/createApi", () => {
  it("exposes the required Scope-A methods plus validateAddress/validateIntent", () => {
    const impl = createApi("bitcoin") as unknown as Record<string, unknown>;
    for (const method of [
      "getBalance",
      "listOperations",
      "lastBlock",
      "craftTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "craftTransactionData",
      "validateAddress",
      "validateIntent",
    ]) {
      expect(typeof impl[method]).toBe("function");
    }
  });

  it.each([
    "getBlock",
    "getBlockInfo",
    "getStakes",
    "getRewards",
    "getValidators",
    "call",
    "craftRawTransaction",
    "register",
    "getNextSequence",
  ])('answers "not supported" for the account-inapplicable method %s', method => {
    const api = withDefaults(createApi("bitcoin")) as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >;
    expect(() => api[method](ctx, "arg")).toThrow(/is not supported/);
  });

  it("reports validateIntent + validateAddress as genuinely supported (not defaulted)", () => {
    const api = withDefaults(createApi("bitcoin"));
    expect(api.supports("validateIntent")).toBe(true);
    expect(api.supports("validateAddress")).toBe(true);
    expect(api.supports("getStakes")).toBe(false);
  });

  it("threads options.derivationPath into logic getBalance (gap-#1 descriptor wiring)", async () => {
    const mocked = getBalanceModule.getBalance as jest.MockedFunction<
      typeof getBalanceModule.getBalance
    >;
    mocked.mockResolvedValue([{ value: 1n, asset: { type: "native" } }]);

    const impl = createApi("bitcoin");
    await impl.getBalance(ctx, "zpubXYZ", { derivationPath: "84'/0'/0'" });

    expect(mocked).toHaveBeenCalledWith(ctx, "bitcoin", "zpubXYZ", "84'/0'/0'");
  });
});

describe("api/createApi — each method delegates to its logic function (currencyId threaded)", () => {
  const impl = () =>
    createApi("bitcoin") as unknown as Record<string, (...a: unknown[]) => unknown>;

  beforeEach(() => jest.clearAllMocks());

  it("broadcast → broadcast(context, currencyId, tx, broadcastConfig)", async () => {
    const broadcastConfig = { source: { name: "ledger-live" } } as never;
    await impl().broadcast(ctx, "rawtxhex", { broadcastConfig });
    expect(jest.mocked(broadcast)).toHaveBeenCalledWith(
      ctx,
      "bitcoin",
      "rawtxhex",
      broadcastConfig,
    );
  });

  it("lastBlock → lastBlock(context, currencyId)", async () => {
    await impl().lastBlock(ctx);
    expect(jest.mocked(lastBlock)).toHaveBeenCalledWith(ctx, "bitcoin");
  });

  it("listOperations → listOperations(context, currencyId, address, options)", async () => {
    const options = { minHeight: 0, derivationPath: "84'/0'/0'" } as never;
    await impl().listOperations(ctx, "zpubACC", options);
    expect(jest.mocked(listOperations)).toHaveBeenCalledWith(ctx, "bitcoin", "zpubACC", options);
  });

  it("estimateFees → estimateFees(context, currencyId, intent, customFeesParameters)", async () => {
    const intent = { recipient: "bc1q" } as never;
    const customFeesParameters = { feePerByte: 2 } as never;
    await impl().estimateFees(ctx, intent, { customFeesParameters });
    expect(jest.mocked(estimateFees)).toHaveBeenCalledWith(
      ctx,
      "bitcoin",
      intent,
      customFeesParameters,
    );
  });

  it("craftTransaction → craftTransaction(context, currencyId, intent, customFees)", async () => {
    const intent = { recipient: "bc1q" } as never;
    const customFees = { parameters: { feePerByte: 2 } } as never;
    await impl().craftTransaction(ctx, intent, { customFees });
    expect(jest.mocked(craftTransaction)).toHaveBeenCalledWith(ctx, "bitcoin", intent, customFees);
  });

  it("validateIntent → validateIntent(context, currencyId, intent, balances, customFees)", async () => {
    const intent = { recipient: "bc1q" } as never;
    const balances = [{ value: 1n, asset: { type: "native" } }] as never;
    const customFees = { value: 1n } as never;
    await impl().validateIntent(ctx, intent, balances, { customFees });
    expect(jest.mocked(validateIntent)).toHaveBeenCalledWith(
      ctx,
      "bitcoin",
      intent,
      balances,
      customFees,
    );
  });

  it("combine → combine(tx, signature) (no context / currencyId)", () => {
    impl().combine(ctx, "unsignedhex", ["sig0"], { pubkey: "pk" });
    expect(jest.mocked(combine)).toHaveBeenCalledWith("unsignedhex", ["sig0"]);
  });

  it("validateAddress → validateAddress(address, parameters) (no context / currencyId)", async () => {
    const parameters = { currencyId: "bitcoin" } as never;
    await impl().validateAddress(ctx, "bc1qrecipient", parameters);
    expect(jest.mocked(validateAddress)).toHaveBeenCalledWith("bc1qrecipient", parameters);
  });

  it("craftTransactionData → framework craftTransactionData(intent)", () => {
    const intent = { recipient: "bc1q" } as never;
    impl().craftTransactionData(ctx, intent);
    expect(jest.mocked(craftTransactionData)).toHaveBeenCalledWith(intent);
  });
});

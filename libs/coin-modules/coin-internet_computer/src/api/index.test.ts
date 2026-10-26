import { requiredApiKeys } from "@ledgerhq/coin-module-framework/api/index";
import type { IcpContext } from "../config";
import { createApi, fetchBalance } from "./index";

const context = {} as IcpContext;

describe("createApi", () => {
  const api = createApi();

  it("implements every required method", () => {
    for (const key of requiredApiKeys) expect(api[key]).toBeInstanceOf(Function);
  });

  it("leaves staking out", () => {
    expect(api).not.toHaveProperty("getStakes");
    expect(api).not.toHaveProperty("getValidators");
  });

  it("estimates the ledger transfer fee", async () => {
    expect(await api.estimateFees(context, {} as never)).toEqual({ value: 10_000n });
  });

  it("validates an account identifier by its checksum", async () => {
    const address = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";

    expect(await api.validateAddress(context, address, {})).toBe(true);
    expect(await api.validateAddress(context, `${address.slice(0, -1)}8`, {})).toBe(false);
  });

  it("reports a refused craft as a rejection, not a synchronous throw", async () => {
    const intent = { intentType: "staking", asset: { type: "native" } } as never;
    let result: Promise<unknown> | undefined;

    expect(() => {
      result = api.craftTransaction(context, intent);
    }).not.toThrow();
    await expect(result).rejects.toThrow(/staking intents are not supported/);
  });

  it("keeps exporting the network client", () => {
    expect(fetchBalance).toBeInstanceOf(Function);
  });
});

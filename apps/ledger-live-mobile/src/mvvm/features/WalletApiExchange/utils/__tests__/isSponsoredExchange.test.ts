import type { ExchangeSessionCompleteRequest } from "../../session";
import { isSponsoredExchange } from "../isSponsoredExchange";

type ExchangeParams = ExchangeSessionCompleteRequest["exchangeParams"];

function params(
  sponsored: boolean | undefined,
  transaction: Record<string, unknown>,
): Pick<ExchangeParams, "sponsored" | "transaction"> {
  return { sponsored, transaction } as unknown as Pick<ExchangeParams, "sponsored" | "transaction">;
}

describe("isSponsoredExchange", () => {
  it("follows the live app's hint over the transaction", () => {
    expect(isSponsoredExchange(params(false, { family: "evm", sponsored: true }))).toBe(false);
    expect(isSponsoredExchange(params(true, { family: "bitcoin" }))).toBe(true);
  });

  it("falls back to the EVM transaction when there is no hint", () => {
    expect(isSponsoredExchange(params(undefined, { family: "evm", sponsored: true }))).toBe(true);
    expect(isSponsoredExchange(params(undefined, { family: "evm", sponsored: false }))).toBe(false);
  });

  it("does not know when neither the hint nor an EVM transaction says", () => {
    expect(isSponsoredExchange(params(undefined, { family: "bitcoin" }))).toBeUndefined();
  });
});

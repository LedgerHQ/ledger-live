import { endpointByCurrencyId } from "../../utils";

describe("endpointByCurrencyId", () => {
  it("gets the aptos endpoint based on the currency id", () => {
    expect(endpointByCurrencyId("aptos")).toBe("https://apt.coin.ledger.com/node/v1");
    expect(endpointByCurrencyId("aptos_testnet")).toBe("https://apt.coin.ledger-stg.com/node/v1");
    expect(() => endpointByCurrencyId("NONE")).toThrow(
      "unexpected currency id format <NONE>, should be like aptos[_testnet]",
    );
  });
});

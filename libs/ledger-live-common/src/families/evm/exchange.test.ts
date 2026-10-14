import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { buildArcAliasTransfer } from "./exchange";
import { evmConfig } from "./config";

describe("buildArcAliasTransfer", () => {
  const recipient = "0x1111111111111111111111111111111111111111";

  beforeAll(() => {
    LiveConfig.setConfig(evmConfig as never);
  });

  it("sends the 6 decimals amount to the alias contract with a zero value", () => {
    const result = buildArcAliasTransfer({
      currencyId: "arc",
      recipient,
      amount: new BigNumber("30000000000000000000"),
    });

    expect(result.recipient).toEqual("0x3600000000000000000000000000000000000000");
    expect(result.amount.toFixed()).toEqual("0");
    expect(result.data.toString("hex")).toEqual(
      "a9059cbb" +
        "0000000000000000000000001111111111111111111111111111111111111111" +
        (30_000_000).toString(16).padStart(64, "0"),
    );
  });

  it("disables useAllAmount so prepareTransaction keeps the value at zero", () => {
    const result = buildArcAliasTransfer({
      currencyId: "arc",
      recipient,
      amount: new BigNumber("30000000000000000000"),
    });

    expect(result.useAllAmount).toEqual(false);
  });

  it("throws when the amount has more than 6 decimals", () => {
    expect(() =>
      buildArcAliasTransfer({
        currencyId: "arc",
        recipient,
        amount: new BigNumber("30000000000000000001"),
      }),
    ).toThrow("more than 6 decimals");
  });

  it("throws when the currency has no native contract configured", () => {
    expect(() =>
      buildArcAliasTransfer({
        currencyId: "ethereum",
        recipient,
        amount: new BigNumber("30000000000000000000"),
      }),
    ).toThrow("No native contract configured for ethereum");
  });
});

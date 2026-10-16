jest.mock("./networks", () => {
  const actual = jest.requireActual("./networks");
  return { ...actual, getNetworkParameters: jest.fn(actual.getNetworkParameters) };
});
import { getNetworkParameters } from "./networks";
import { cryptoFor, displayAddress, inputSequence, isRbfCurrency, signingRules } from "./currency";

describe("cryptoFor", () => {
  it("builds the currency rules once", () => {
    expect(cryptoFor("litecoin")).toBe(cryptoFor("litecoin"));
  });
});

describe("displayAddress", () => {
  it("shows a Bitcoin Cash address without its cashaddr prefix", () => {
    expect(
      displayAddress("bitcoin_cash", "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a"),
    ).toBe("qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a");
    expect(displayAddress("bitcoin_cash", "qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a")).toBe(
      "qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a",
    );
  });

  it("shows any other address as is", () => {
    expect(displayAddress("bitcoin", "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs")).toBe(
      "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs",
    );
  });
});

describe("replaceability", () => {
  it("is signalled on bitcoin networks only", () => {
    expect(isRbfCurrency("bitcoin")).toBe(true);
    expect(isRbfCurrency("bitcoin_testnet")).toBe(true);
    expect(isRbfCurrency("litecoin")).toBe(false);
    expect(inputSequence("bitcoin_regtest")).toBe(0);
    expect(inputSequence("dogecoin")).toBe(0xffffffff);
  });
});

describe("signingRules", () => {
  it.each([
    ["bitcoin", "Native SegWit", "bc1q", ["bitcoin", "bech32"], true],
    ["bitcoin", "Taproot", "bc1p", ["bitcoin", "bech32m"], true],
    ["bitcoin", "Legacy", "1abc", ["bitcoin"], false],
    ["litecoin", "SegWit", "M", ["litecoin"], true],
    ["bitcoin_gold", "Legacy", "G", ["bitcoin_gold", "bip143"], false],
    ["komodo", "Legacy", "R", ["komodo", "sapling"], false],
  ] as const)("%s %s", (currency, mode, recipient, additionals, segwit) => {
    const rules = signingRules(currency, mode, recipient, 1_000_000);
    expect(rules.additionals).toEqual(additionals);
    expect(rules.segwit).toBe(segwit);
    expect(rules.sigHashType).toBe(getNetworkParameters(currency).sigHash);
  });

  it("adds cashaddr for an explicit Bitcoin Cash address", () => {
    expect(
      signingRules("bitcoin_cash", "Legacy", "qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a")
        .additionals,
    ).toEqual(["bitcoin_cash", "bip143", "cashaddr"]);
    expect(
      signingRules(
        "bitcoin_cash",
        "Legacy",
        "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a",
      ).additionals,
    ).toEqual(["bitcoin_cash", "bip143", "cashaddr"]);
    expect(
      signingRules("bitcoin_cash", "Legacy", "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2").additionals,
    ).toEqual(["bitcoin_cash", "bip143"]);
  });

  it("carries the expiry height and extra data of the coins that need them", () => {
    expect(signingRules("decred", "Legacy", "D")).toMatchObject({
      expiryHeight: "00000000",
      hasExtraData: false,
    });
    expect(signingRules("zencash", "Legacy", "z")).toMatchObject({ hasExtraData: true });
    expect(signingRules("bitcoin", "Legacy", "1").expiryHeight).toBeUndefined();
  });

  it("sets Komodo's reward lock time", () => {
    expect(signingRules("komodo", "Legacy", "R", 1_000_000_000).lockTime).toBe(1_000_000 - 777);
    expect(signingRules("bitcoin", "Legacy", "1").lockTime).toBeUndefined();
  });

  it("refuses a currency without a sighash", () => {
    (getNetworkParameters as jest.Mock).mockReturnValueOnce({ sigHash: NaN });
    expect(() => signingRules("bitcoin", "Legacy", "1")).toThrow("sigHashType should not be NaN");
  });
});

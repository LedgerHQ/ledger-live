import { isValidAddress } from "./logic";
import { NetworkId } from "./types";

describe("address validation", () => {
  it("should check for invalid address", () => {
    const isValid = isValidAddress("bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23", NetworkId.mainnet);
    expect(isValid).toEqual(false);
  });

  it("should check for valid byron address", () => {
    const isValidByronAddress1 = isValidAddress(
      "Ae2tdPwUPEZFBgKrLT9pn8JPJVbefcL4kuznpQxQpxKfTVuHJ9gLAmxKk4w",
      NetworkId.mainnet,
    );
    expect(isValidByronAddress1).toEqual(true);

    const isValidByronAddress2 = isValidAddress(
      "DdzFFzCqrhst6mdc3hmFeWu77FZdYNjV7tTGVtEBXQzE3iCqyZWn9SSWCBrjRbbhj94VHAyGU96khi8qGM1B29nGs1jZRZEWKg2MwbVb",
      NetworkId.mainnet,
    );
    expect(isValidByronAddress2).toEqual(true);
  });

  it("should check for valid shelley address", () => {
    const isValidShelleyAddress = isValidAddress(
      "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms",
      NetworkId.mainnet,
    );

    expect(isValidShelleyAddress).toEqual(true);
  });
});

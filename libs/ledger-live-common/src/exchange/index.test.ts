import { createExchangeProviderNameAndSignature } from ".";

describe("createExchangeProviderNameAndSignature", () => {
  test("should return valid ExchangeProviderNameAndSignature", () => {
    // Given
    const name = "Baanx";
    const publicKey =
      "04551878b446b6a711949fa51cc5a8685602f8ffb1dfd08f6ab869019d7c125d7737a79e8b5022d860ec7dfbe062d510fec3b5fe0f6ebb1f5e55a074bb7e5dbc4e";
    const signature =
      "304402200345c39e93a22c5ac3f1e70f8b9938b3a60d3a4906067443cf11095af0e685a502201ee5d88dd5539ce36341e49e2505c2a1659e26d8ff08801ed33c50a9126aedd1";

    // When
    const res = createExchangeProviderNameAndSignature({
      name,
      publicKey,
      signature,
    });

    // Then
    expect(res.nameAndPubkey).toBeInstanceOf(Buffer);
    expect(res.signature).toBeInstanceOf(Buffer);

    expect(res.nameAndPubkey.toString("hex")).toEqual(
      "054261616e7804551878b446b6a711949fa51cc5a8685602f8ffb1dfd08f6ab869019d7c125d7737a79e8b5022d860ec7dfbe062d510fec3b5fe0f6ebb1f5e55a074bb7e5dbc4e",
    );
    expect(res.signature.toString("hex")).toEqual(signature);
  });
});

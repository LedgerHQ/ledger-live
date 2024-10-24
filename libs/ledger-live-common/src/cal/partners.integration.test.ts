import { getProvidersCDNData, getProvidersData } from "./partners";

describe("getProvidersCDNData", () => {
  it("returns CEX data in expected format", async () => {
    // Given

    // When
    const partners = await getProvidersCDNData();

    // Then
    expect(partners["changelly"]).toEqual({
      continuesInProviderLiveApp: false,
      displayName: "Changelly",
      mainUrl: "https://changelly.com/",
      needsKYC: false,
      supportUrl: "https://support.changelly.com/en/support/home",
      termsOfUseUrl: "https://changelly.com/terms-of-use",
      type: "CEX",
    });
  });

  it("returns DEX data in expected format", async () => {
    // Given

    // When
    const partners = await getProvidersCDNData();

    // Then
    expect(partners["paraswap"]).toEqual({
      continuesInProviderLiveApp: true,
      displayName: "Paraswap",
      mainUrl: "https://www.paraswap.io/",
      needsKYC: false,
      supportUrl: "https://help.paraswap.io/en/",
      termsOfUseUrl: "https://files.paraswap.io/tos_v4.pdf",
      type: "DEX",
    });
  });
});

describe("getProvidersData", () => {
  it("returns data in expected format", async () => {
    // Given

    // When
    const partners = await getProvidersData("swap");

    // Then
    expect(partners["changelly"]).toEqual({
      name: "Changelly",
      publicKey: {
        curve: "secp256k1",
        data: Buffer.from(
          "0480d7c0d3a9183597395f58dda05999328da6f18fabd5cda0aff8e8e3fc633436a2dbf48ecb23d40df7c3c7d3e774b77b4b5df0e9f7e08cf1cdf2dba788eb085b",
          "hex",
        ),
      },
      signature: Buffer.from(
        "3045022100e73339e5071b5d232e8cacecbd7c118c919122a43f8abb8b2062d4bfcd58274e022050b11605d8b7e199f791266146227c43fd11d7645b1d881f705a2f8841d21de5",
        "hex",
      ),
      version: 1,
    });
  });
});

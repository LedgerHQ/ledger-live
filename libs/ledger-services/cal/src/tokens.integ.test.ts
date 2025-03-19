import { STAGING_ENV } from "./common";
import { findToken } from "./tokens";

describe("findToken", () => {
  it.each([
    {
      name: "id",
      request: { id: "solana/spl/es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb" },
    },
    {
      name: "ticker and blockchain",
      request: { blockchain: "solana", ticker: "USDT" },
    },
  ])(`returns token when filter with $name`, async ({ request }) => {
    // When
    const currencies = await findToken(request, { ...STAGING_ENV, signatureKind: "test" });

    // Then
    expect(currencies).toEqual({
      id: "solana/spl/es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb",
      chainId: 1,
      contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      config: "045553445406536f6c616e6106045553445406",
      decimals: 6,
      network: "solana",
      networkType: "main",
      family: "solana",
      name: "USDT",
      symbol: "USDT",
      ticker: "USDT",
      units: [
        {
          code: "USDT",
          name: "USDT",
          magnitude: 6,
        },
      ],
      signature:
        "304402200dbf292d72c9ad6f203f7765d3123bcafb8257de259ef509e51498e6ae145cf7022001098225f3d52ad4ef2fc09393fd1e09c848c03d8e4cd6e47de960a27dcf6682",
    });
  });
});

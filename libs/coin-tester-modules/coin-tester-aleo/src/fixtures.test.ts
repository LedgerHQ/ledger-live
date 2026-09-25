import {
  packAsciiToU128,
  TOKEN_DECIMALS,
  TOKEN_MAX_SUPPLY,
  TOKEN_MINT_AMOUNT,
  TOKEN_NAME_U128,
  TOKEN_PROGRAM_ID,
  TOKEN_SYMBOL_U128,
  TOKEN_TRANSFER_AMOUNT,
  USAD_TOKEN,
  buildAleoCoinConfig,
} from "./fixtures";

describe("packAsciiToU128", () => {
  it("packs ASCII bytes little-endian", () => {
    // 'U'=0x55 'S'=0x53 'A'=0x41 'D'=0x44 -> LE integer 0x44415355
    expect(packAsciiToU128("USAD")).toBe(0x44415355n);
  });

  it("throws for text longer than 16 bytes", () => {
    expect(() => packAsciiToU128("a".repeat(17))).toThrow();
  });
});

describe("token fixtures", () => {
  it("derives the name/symbol packing from the same 'USAD' text", () => {
    expect(TOKEN_NAME_U128).toBe(packAsciiToU128("USAD"));
    expect(TOKEN_SYMBOL_U128).toBe(packAsciiToU128("USAD"));
  });

  it("keeps every fixture amount below 2^53", () => {
    expect(TOKEN_MINT_AMOUNT).toBeLessThan(2 ** 53);
    expect(TOKEN_TRANSFER_AMOUNT).toBeLessThan(2 ** 53);
    expect(Number(TOKEN_MAX_SUPPLY)).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it("sizes the transfer as a clean fraction of the mint", () => {
    expect(TOKEN_MINT_AMOUNT % TOKEN_TRANSFER_AMOUNT).toBe(0n);
  });

  it("describes USAD_TOKEN consistently with TOKEN_PROGRAM_ID", () => {
    expect(USAD_TOKEN.contractAddress).toBe(TOKEN_PROGRAM_ID);
    expect(USAD_TOKEN.tokenType).toBe("arc22");
    expect(USAD_TOKEN.parentCurrencyId).toBe("aleo_testnet");
    expect(USAD_TOKEN.units[0].magnitude).toBe(TOKEN_DECIMALS);
  });

  it("defaults enableTokens to false and flips it on request", () => {
    expect(buildAleoCoinConfig().enableTokens).toBe(false);
    expect(buildAleoCoinConfig({ enableTokens: true }).enableTokens).toBe(true);
  });
});

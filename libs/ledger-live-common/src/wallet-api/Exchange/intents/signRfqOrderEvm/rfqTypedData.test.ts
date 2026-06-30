import type { QuotePermit2Message } from "../../quotes/types";
import { toRfqEIP712Message } from "./rfqTypedData";

const BASE_DOMAIN = {
  name: "Permit2",
  chainId: 1,
  verifyingContract: "0xPermit2",
};

const BASE_TYPES = {
  EIP712Domain: [],
  PermitSingle: [],
  PermitDetails: [],
};

const BASE_VALUES = {
  details: {
    token: "0xtoken",
    amount: "1",
    expiration: "0",
    nonce: "0",
  },
  spender: "0xspender",
  sigDeadline: "0",
};

const UNISWAPX_TYPED_DATA: QuotePermit2Message = {
  values: BASE_VALUES,
  domain: BASE_DOMAIN,
  types: BASE_TYPES,
};

const ONEINCH_FUSION_TYPED_DATA: QuotePermit2Message = {
  message: BASE_VALUES,
  domain: BASE_DOMAIN,
  types: BASE_TYPES,
  primaryType: "Order",
};

describe("toRfqEIP712Message", () => {
  it("forces primaryType to PermitWitnessTransferFrom for UniswapX even when the quote omits it", () => {
    const result = toRfqEIP712Message(UNISWAPX_TYPED_DATA, "uniswapx");
    expect(result.primaryType).toBe("PermitWitnessTransferFrom");
  });

  it("preserves the provider-supplied primaryType for 1inch Fusion", () => {
    const result = toRfqEIP712Message(
      ONEINCH_FUSION_TYPED_DATA,
      "oneinchfusion",
    );
    expect(result.primaryType).toBe("Order");
  });

  it("reads message from `values` (UniswapX) when present", () => {
    const result = toRfqEIP712Message(UNISWAPX_TYPED_DATA, "uniswapx");
    expect(result.message).toEqual(BASE_VALUES);
  });

  it("reads message from `message` (1inch Fusion) when `values` is absent", () => {
    const result = toRfqEIP712Message(
      ONEINCH_FUSION_TYPED_DATA,
      "oneinchfusion",
    );
    expect(result.message).toEqual(BASE_VALUES);
  });

  it("falls back to the canonical Permit2 EIP712Domain entries when the quote omits them", () => {
    const result = toRfqEIP712Message(
      {
        ...UNISWAPX_TYPED_DATA,
        types: {
          PermitSingle: [],
          PermitDetails: [],
        } as unknown as QuotePermit2Message["types"],
      },
      "uniswapx",
    );
    expect(result.types.EIP712Domain).toEqual([
      { name: "name", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ]);
  });

  it("preserves the partner-provided EIP712Domain entries (1inch Fusion ships `version`, which CAL hashes into its descriptor lookup)", () => {
    const fusionDomainEntries = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ];
    const result = toRfqEIP712Message(
      {
        ...ONEINCH_FUSION_TYPED_DATA,
        types: {
          EIP712Domain: fusionDomainEntries,
          Order: [],
        } as unknown as QuotePermit2Message["types"],
      },
      "oneinchfusion",
    );
    expect(result.types.EIP712Domain).toEqual(fusionDomainEntries);
  });

  it("throws when the payload is missing both `values` and `message`", () => {
    expect(() =>
      toRfqEIP712Message(
        { domain: BASE_DOMAIN, types: BASE_TYPES },
        "uniswapx",
      ),
    ).toThrow(/values/);
  });

  it("throws when the payload is missing the domain", () => {
    expect(() =>
      toRfqEIP712Message(
        { values: BASE_VALUES, types: BASE_TYPES },
        "uniswapx",
      ),
    ).toThrow(/domain/);
  });

  it("throws when the payload is missing the types", () => {
    expect(() =>
      toRfqEIP712Message(
        { values: BASE_VALUES, domain: BASE_DOMAIN },
        "uniswapx",
      ),
    ).toThrow(/types/);
  });

  it("throws when 1inch Fusion omits its primaryType", () => {
    expect(() =>
      toRfqEIP712Message(
        { values: BASE_VALUES, domain: BASE_DOMAIN, types: BASE_TYPES },
        "oneinchfusion",
      ),
    ).toThrow(/primaryType/);
  });
});

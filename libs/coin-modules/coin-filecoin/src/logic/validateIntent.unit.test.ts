import { validateIntent } from "./validateIntent";

jest.mock("@ledgerhq/logs");
// Mock the iso-filecoin-backed validator so synthetic test addresses pass.
// validateAddress.unit.test.ts exercises the real delegation path.
jest.mock("../network/addresses", () => ({
  validateAddress: (input: string) => ({
    isValid: input !== "NOT-VALID",
    parsedAddress: { toString: () => input },
  }),
  isRecipientValidForTokenTransfer: () => true,
}));

const NATIVE_BALANCES = [
  { value: 5_000_000_000_000_000_000n, asset: { type: "native" as const }, locked: 0n },
];

const baseIntent = {
  intentType: "transaction" as const,
  type: "send" as const,
  sender: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
  recipient: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
  amount: 1_000_000_000_000_000_000n,
  asset: { type: "native" as const },
  useAllAmount: false,
};

describe("validateIntent", () => {
  it("returns no errors for valid native intent with sufficient balance", async () => {
    const result = await validateIntent(baseIntent, NATIVE_BALANCES);
    expect(result.errors).toEqual({});
  });

  it("returns recipient error for invalid address", async () => {
    const intent = { ...baseIntent, recipient: "NOT-VALID" };
    const result = await validateIntent(intent, NATIVE_BALANCES);
    expect(result.errors.recipient).toBeInstanceOf(Error);
  });

  it("returns amount error when amount exceeds balance", async () => {
    const intent = { ...baseIntent, amount: 100_000_000_000_000_000_000n };
    const result = await validateIntent(intent, NATIVE_BALANCES);
    expect(result.errors.amount).toBeInstanceOf(Error);
  });

  it("emits feeTooHigh warning when fees exceed balance", async () => {
    const lowBalance = [{ value: 100n, asset: { type: "native" as const }, locked: 0n }];
    const smallIntent = { ...baseIntent, amount: 1n };
    const result = await validateIntent(smallIntent, lowBalance, { value: 200n });
    expect(result.warnings.feeTooHigh).toBeInstanceOf(Error);
  });

  it("checks token balance for erc20 intent", async () => {
    const tokenIntent = {
      ...baseIntent,
      amount: 5_000n,
      asset: {
        type: "erc20" as const,
        assetReference: "0xcontract",
      },
    };
    const tokenBalances = [
      ...NATIVE_BALANCES,
      {
        value: 3_000n,
        asset: { type: "erc20" as const, assetReference: "0xcontract" },
      },
    ];
    const result = await validateIntent(tokenIntent, tokenBalances);
    expect(result.errors.amount).toBeInstanceOf(Error); // 5000 > 3000
  });

  it("rejects erc20 intent when native balance is insufficient to cover fees", async () => {
    const tokenIntent = {
      ...baseIntent,
      amount: 100n,
      asset: {
        type: "erc20" as const,
        assetReference: "0xcontract",
      },
    };
    const balancesWithLowNative = [
      { value: 10n, asset: { type: "native" as const }, locked: 0n },
      { value: 1_000n, asset: { type: "erc20" as const, assetReference: "0xcontract" } },
    ];
    const result = await validateIntent(tokenIntent, balancesWithLowNative, { value: 500n });
    expect(result.errors.amount).toBeInstanceOf(Error); // fees 500 > native 10
  });
});

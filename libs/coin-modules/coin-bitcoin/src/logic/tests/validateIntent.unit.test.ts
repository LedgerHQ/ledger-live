import { validateIntent } from "../validateIntent";
import * as address from "../validateAddress";
import type {
  Balance,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../../api/config";

jest.mock("../validateAddress");
jest.mock("@ledgerhq/ledger-wallet-framework/currencies", () => ({
  getCryptoCurrencyById: jest.fn(() => ({ name: "Bitcoin" })),
}));

const mockedValidateAddress = address.validateAddress as jest.MockedFunction<
  typeof address.validateAddress
>;

const context = {} as unknown as BitcoinContext;

const nativeBalance = (value: bigint, locked?: bigint): Balance[] => [
  { value, asset: { type: "native" }, ...(locked === undefined ? {} : { locked }) },
];

const intent = (over: Partial<TransactionIntent> = {}): TransactionIntent =>
  ({
    sender: "zpubSENDER",
    recipient: "bc1qrecipient",
    amount: 10_000n,
    asset: { type: "native" },
    ...over,
  }) as unknown as TransactionIntent;

const fees = (value: bigint): FeeEstimation => ({ value });

describe("logic/validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateAddress.mockResolvedValue(true);
  });

  it("accepts a well-funded native send and reports amount + totalSpent", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent(),
      nativeBalance(1_000_000n),
      fees(1_000n),
    );

    expect(res.errors).toEqual({});
    expect(res.warnings).toEqual({});
    expect(res.estimatedFees).toBe(1_000n);
    expect(res.amount).toBe(10_000n);
    expect(res.totalSpent).toBe(11_000n);
  });

  it("flags a missing recipient with RecipientRequired", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ recipient: "" }),
      nativeBalance(1_000_000n),
      fees(1_000n),
    );
    expect(res.errors.recipient?.name).toBe("RecipientRequired");
  });

  it("rejects a recipient equal to the sender xpub", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ recipient: "zpubSENDER" }),
      nativeBalance(1_000_000n),
      fees(1_000n),
    );
    expect(res.errors.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });

  it("rejects a malformed recipient address with InvalidAddress", async () => {
    mockedValidateAddress.mockResolvedValue(false);
    const res = await validateIntent(
      context,
      "bitcoin",
      intent(),
      nativeBalance(1_000_000n),
      fees(1_000n),
    );
    expect(res.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("requires a positive amount when not sending the full balance", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ amount: 0n }),
      nativeBalance(1_000_000n),
      fees(1_000n),
    );
    expect(res.errors.amount?.name).toBe("AmountRequired");
  });

  it("flags NotEnoughBalance when amount + fees exceed the spendable balance", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ amount: 10_000n }),
      nativeBalance(10_500n),
      fees(1_000n),
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("subtracts locked funds from the spendable balance", async () => {
    // value 12_000 − locked 5_000 = 7_000 spendable; 6_000 + 1_500 = 7_500 > 7_000 ⇒ not enough
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ amount: 6_000n }),
      nativeBalance(12_000n, 5_000n),
      fees(1_500n),
    );
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("computes the max amount and clears errors for useAllAmount", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ useAllAmount: true, amount: 0n }),
      nativeBalance(50_000n),
      fees(2_000n),
    );
    expect(res.errors.amount).toBeUndefined();
    expect(res.amount).toBe(48_000n); // 50_000 − 2_000 fees
    expect(res.totalSpent).toBe(50_000n);
  });

  it("warns FeeTooHigh when fees exceed 10% of the amount", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ amount: 5_000n }),
      nativeBalance(1_000_000n),
      fees(1_000n),
    );
    expect(res.warnings.feeTooHigh?.name).toBe("FeeTooHigh");
    expect(res.errors).toEqual({});
  });

  // Dust cases use the real computeDustAmount / cryptoFactory (mocking wallet-btc/utils would break
  // BitcoinLikeWallet's own use of it). The native-segwit dust threshold is a few hundred sats, so
  // 1 sat is unambiguously dust and 100_000 sat is unambiguously fine.
  it("flags a sub-dust amount with DustLimit (script type from the derivation path)", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ amount: 1n, senderDerivationPath: "84'/0'/0'" }),
      nativeBalance(1_000_000n),
      fees(500n),
    );
    expect(res.errors.dustLimit?.name).toBe("DustLimit");
  });

  it("does not flag DustLimit for a normal amount", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ amount: 100_000n, senderDerivationPath: "84'/0'/0'" }),
      nativeBalance(1_000_000n),
      fees(500n),
    );
    expect(res.errors.dustLimit).toBeUndefined();
  });

  it("skips the dust check when no derivation path is provided", async () => {
    const res = await validateIntent(
      context,
      "bitcoin",
      intent({ amount: 1n }),
      nativeBalance(1_000_000n),
      fees(500n),
    );
    expect(res.errors.dustLimit).toBeUndefined();
  });
});

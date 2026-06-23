import { BigNumber } from "bignumber.js";
import { MAX_UTXOS_PER_TX } from "../logic/constants";
import { KaspaUtxoGenerator } from "../logic/tests/utxoSelection.test";
import { KaspaAccount } from "../types";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getCachedUtxos } from "./getTransactionStatus";

jest.mock("./getTransactionStatus", () => ({
  __esModule: true,
  default: jest.fn(),
  getCachedUtxos: jest.fn(),
}));

const mockGetCachedUtxos = getCachedUtxos as unknown as jest.Mock;

const UTXO_AMOUNT = new BigNumber(1_0000_0000); // 1 KAS each

const makeAccount = (): KaspaAccount =>
  ({
    type: "Account",
    id: "js:2:kaspa:xpub:",
    xpub: "deadbeef",
  }) as unknown as KaspaAccount;

describe("estimateMaxSpendable", () => {
  afterEach(() => jest.clearAllMocks());

  it("caps the max spendable at MAX_UTXOS_PER_TX inputs when the wallet is fragmented", async () => {
    const utxoCount = 100; // more than the 88-input limit
    const utxos = KaspaUtxoGenerator.generateUtxoSet(utxoCount, UTXO_AMOUNT, "1000");
    mockGetCachedUtxos.mockResolvedValue({ utxos, accountAddresses: {} });

    const result = await estimateMaxSpendable({ account: makeAccount() } as never);

    const expected = UTXO_AMOUNT.times(MAX_UTXOS_PER_TX)
      .minus(MAX_UTXOS_PER_TX * 1118 + 506)
      .toNumber();

    expect(result.toNumber()).toBe(expected);
    expect(result.toNumber()).toBeLessThan(UTXO_AMOUNT.times(utxoCount).toNumber());
  });

  it("returns the sum of all UTXOs (minus fee) when the wallet has <= 88 UTXOs", async () => {
    const utxoCount = 10;
    const utxos = KaspaUtxoGenerator.generateUtxoSet(utxoCount, UTXO_AMOUNT, "1000");
    mockGetCachedUtxos.mockResolvedValue({ utxos, accountAddresses: {} });

    const result = await estimateMaxSpendable({ account: makeAccount() } as never);

    const expected = UTXO_AMOUNT.times(utxoCount)
      .minus(utxoCount * 1118 + 506)
      .toNumber();

    expect(result.toNumber()).toBe(expected);
  });

  it("returns 0 when the account has no xpub", async () => {
    const result = await estimateMaxSpendable({
      account: { type: "Account", id: "x" } as unknown as KaspaAccount,
    } as never);

    expect(result.toNumber()).toBe(0);
    expect(mockGetCachedUtxos).not.toHaveBeenCalled();
  });
});

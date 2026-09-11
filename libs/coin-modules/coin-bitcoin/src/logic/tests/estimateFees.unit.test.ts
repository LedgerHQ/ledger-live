import { estimateFees } from "../estimateFees";
import * as buildAccount from "../buildAccount";
import type { BitcoinContext } from "../../api/config";

jest.mock("../buildAccount");
jest.mock("@ledgerhq/wallet-btc/pickingstrategies/CoinSelect", () => ({ CoinSelect: class {} }));

const mockedBuild = buildAccount.buildSyncedAccount as jest.MockedFunction<
  typeof buildAccount.buildSyncedAccount
>;

const context = {} as unknown as BitcoinContext;

// estimateFees takes the full TransactionIntent; the tests only set the fields it reads.
const asIntent = (o: Record<string, unknown>) => o as unknown as Parameters<typeof estimateFees>[2];

// Captures the feePerByte wallet-btc's buildTx is ultimately driven with.
let usedFeePerByte: number | undefined;

function mockAccount(): void {
  usedFeePerByte = undefined;
  mockedBuild.mockResolvedValue({
    xpub: {
      crypto: {},
      derivationMode: "Native SegWit",
      explorer: {
        // 2/3/6 targets → [ceil(2000/1000)=2, ceil(1500/1000)=2, ceil(1000/1000)=1]; median idx 1 → 2
        getFees: async () => ({ "2": 2000, "3": 1500, "6": 1000, last_updated: 1 }),
      },
      getNewAddress: async () => ({ account: 1, index: 0, address: "changeAddr" }),
      buildTx: async (params: { feePerByte: number }) => {
        usedFeePerByte = params.feePerByte;
        return { fee: 250, inputs: [], outputs: [], associatedDerivations: [], changeAddress: {} };
      },
    },
  } as unknown as Awaited<ReturnType<typeof buildAccount.buildSyncedAccount>>);
}

describe("logic/estimateFees", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockAccount();
  });

  it("returns the fee of a candidate tx built at the network median rate, echoing the rate", async () => {
    const result = await estimateFees(
      context,
      "bitcoin",
      asIntent({
        sender: "zpub",
        recipient: "bc1qdest",
        amount: 10000n,
        senderDerivationPath: "84'/0'/0'",
      }),
    );

    expect(result.value).toBe(250n);
    expect(result.parameters).toEqual({ feePerByte: 2 });
    expect(usedFeePerByte).toBe(2);
  });

  it("uses the user-provided fee rate over the network estimate", async () => {
    const result = await estimateFees(
      context,
      "bitcoin",
      asIntent({
        sender: "zpub",
        recipient: "bc1qdest",
        amount: 10000n,
        senderDerivationPath: "84'/0'/0'",
      }),
      { feePerByte: 40 },
    );

    expect(usedFeePerByte).toBe(40);
    expect(result.parameters).toEqual({ feePerByte: 40 });
  });
});

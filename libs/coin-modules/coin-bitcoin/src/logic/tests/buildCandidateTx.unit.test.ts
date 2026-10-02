import BigNumber from "bignumber.js";
import { buildCandidateTx } from "../buildCandidateTx";
import type { Account as WalletBtcAccount } from "@ledgerhq/wallet-btc/account";

jest.mock("@ledgerhq/wallet-btc/pickingstrategies/CoinSelect", () => ({ CoinSelect: class {} }));
// Only exercised on the useAllAmount path; the max-spendable helper lives on the wallet instance.
jest.mock("@ledgerhq/wallet-btc/wallet", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    estimateAccountMaxSpendable: async () => new BigNumber(6_000_000),
  })),
}));

type BuildTxParams = {
  destAddress: string;
  amount: BigNumber;
  feePerByte: number;
  changeAddress: unknown;
};

describe("logic/buildCandidateTx", () => {
  it("builds a tx at the given feePerByte with a fresh change address", async () => {
    let captured: BuildTxParams | undefined;
    const getNewAddress = jest.fn(async () => ({ account: 1, index: 0, address: "changeAddr" }));
    const account = {
      xpub: {
        crypto: {},
        derivationMode: "Native SegWit",
        getNewAddress,
        buildTx: async (params: BuildTxParams) => {
          captured = params;
          return { fee: 500, inputs: [], outputs: [] };
        },
      },
    } as unknown as WalletBtcAccount;

    const txInfo = await buildCandidateTx(account, "bc1qdest", 12345n, 7);

    // change address comes from the internal (account 1) chain, gap 1
    expect(getNewAddress).toHaveBeenCalledWith(1, 1);
    expect(captured?.feePerByte).toBe(7);
    expect(captured?.destAddress).toBe("bc1qdest");
    expect(captured?.amount).toBeInstanceOf(BigNumber);
    expect(captured?.amount.toString()).toBe("12345");
    expect(captured?.changeAddress).toEqual({ account: 1, index: 0, address: "changeAddr" });
    expect(txInfo.fee).toBe(500);
  });

  it("sweeps the max spendable amount when useAllAmount is set (ignores the passed amount)", async () => {
    let captured: BuildTxParams | undefined;
    const account = {
      xpub: {
        crypto: {},
        derivationMode: "Native SegWit",
        getNewAddress: jest.fn(async () => ({ account: 1, index: 0, address: "changeAddr" })),
        buildTx: async (params: BuildTxParams) => {
          captured = params;
          return { fee: 300, inputs: [], outputs: [] };
        },
      },
    } as unknown as WalletBtcAccount;

    await buildCandidateTx(account, "bc1qdest", 999n, 7, true);

    // amount comes from estimateAccountMaxSpendable (6_000_000), NOT the passed 999n
    expect(captured?.amount.toString()).toBe("6000000");
  });
});

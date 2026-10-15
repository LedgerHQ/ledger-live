import { BigNumber } from "bignumber.js";
import type { Account as WalletAccount, TransactionInfo } from "@ledgerhq/wallet-btc/index";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { TEST_CONFIG, testContext } from "../test/coinConfig";
import { bindExplorer } from "../bridge/explorer";
import { getWalletAccount } from "../bridge/getWalletAccount";
import { LEGACY_MARGINAL_FEE } from "../logic/coin-selection";
import { buildLegacyTransaction, resolveWalletAccount } from "./buildTransaction";

const logger = jest.fn();
const estimateAccountMaxSpendable = jest.fn();

jest.mock("../bridge/explorer", () => ({
  bindExplorer: jest.fn((walletAccount: unknown) => walletAccount),
}));
jest.mock("../bridge/getWalletAccount");
// Pricing is covered by fees.test.ts; here the build only has to run at the rate it is given.
const zcashSafeFeePerByte = jest.fn((..._args: unknown[]) => new BigNumber(40));
const buildAtZip317Rate = jest.fn(
  async (
    rate: BigNumber,
    _marginalFee: number,
    build: (feePerByte: BigNumber) => Promise<TransactionInfo>,
  ) => ({ txInfo: await build(rate), feePerByte: rate }),
);

jest.mock("./fees", () => ({
  zcashSafeFeePerByte: (...args: unknown[]) => zcashSafeFeePerByte(...args),
  buildAtZip317Rate: (...args: Parameters<typeof buildAtZip317Rate>) => buildAtZip317Rate(...args),
}));
jest.mock("@ledgerhq/wallet-btc/index", () => ({
  ...jest.requireActual("@ledgerhq/wallet-btc/index"),
  __esModule: true,
  default: {
    estimateAccountMaxSpendable: (...args: unknown[]) => estimateAccountMaxSpendable(...args),
  },
}));

const T1 = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const CHANGE = { account: 1, index: 3, address: "t1change" };
const account = { id: "js:2:zcash:xpub:", currency: { id: "zcash" } } as unknown as ZcashAccount;
const tx = (fields: Partial<Transaction>): Transaction =>
  ({
    family: "zcash",
    amount: new BigNumber(50_000),
    recipient: T1,
    useAllAmount: false,
    ...fields,
  }) as Transaction;

const buildTx = jest.fn(async () => ({ fee: 10_000 }) as unknown as TransactionInfo);
const walletAccount = {
  xpub: { crypto: {}, derivationMode: "", buildTx, getNewAddress: jest.fn(async () => CHANGE) },
} as unknown as WalletAccount;

beforeEach(() => {
  jest.clearAllMocks();
  (getWalletAccount as jest.Mock).mockReturnValue(walletAccount);
});

describe("resolveWalletAccount", () => {
  it("binds the account's wallet-btc engine to the configured explorer", async () => {
    expect(await resolveWalletAccount(testContext, account)).toBe(walletAccount);
    expect(bindExplorer).toHaveBeenCalledWith(walletAccount, account.currency, TEST_CONFIG);
  });
});

describe("buildLegacyTransaction", () => {
  it("builds a final, non-replaceable send to the recipient with change on the change chain", async () => {
    await buildLegacyTransaction(logger, walletAccount, tx({}), LEGACY_MARGINAL_FEE);

    expect(buildTx).toHaveBeenCalledWith(
      logger,
      expect.objectContaining({
        destAddress: T1,
        amount: new BigNumber(50_000),
        feePerByte: 40,
        changeAddress: CHANGE,
        sequence: 0xffffffff,
      }),
    );
  });

  it.each([5_000, 1_000])(
    "prices at the safe rate and the tightening for %i per action",
    async marginalFee => {
      await buildLegacyTransaction(logger, walletAccount, tx({}), marginalFee);

      expect(zcashSafeFeePerByte).toHaveBeenCalledWith(
        walletAccount.xpub.crypto,
        walletAccount.xpub.derivationMode,
        marginalFee,
      );
      expect(buildAtZip317Rate).toHaveBeenCalledWith(
        new BigNumber(40),
        marginalFee,
        expect.any(Function),
      );
    },
  );

  it("sends what wallet-btc can spend at that rate when sending everything", async () => {
    estimateAccountMaxSpendable.mockResolvedValue(new BigNumber(140_000));

    await buildLegacyTransaction(
      logger,
      walletAccount,
      tx({ useAllAmount: true }),
      LEGACY_MARGINAL_FEE,
    );

    expect(estimateAccountMaxSpendable).toHaveBeenCalledWith(logger, walletAccount, 40, [], [T1]);
    expect(buildTx).toHaveBeenCalledWith(
      logger,
      expect.objectContaining({ amount: new BigNumber(140_000) }),
    );
  });
});

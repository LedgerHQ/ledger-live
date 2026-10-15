import { BigNumber } from "bignumber.js";
import type { Account as WalletAccount, TransactionInfo } from "@ledgerhq/wallet-btc/index";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { TEST_CONFIG, testContext } from "../test/coinConfig";
import { bindExplorer } from "../bridge/explorer";
import { getWalletAccount } from "../bridge/getWalletAccount";
import { LEGACY_MARGINAL_FEE } from "../logic/coin-selection";
import { buildPrepareTransaction } from "../bridge/prepareTransaction";
import { ZcashPreparedBuildMismatch } from "../types/errors";
import { FixedSelection } from "./fixedSelection";
import {
  buildLegacyTransaction,
  buildPreparedLegacyTransaction,
  resolveWalletAccount,
} from "./buildTransaction";

const logger = jest.fn();
const prepareTransaction = buildPrepareTransaction(testContext);
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

const utxo = (hash: string, value: number) => ({
  hash,
  outputIndex: 0,
  blockHeight: 1,
  address: `addr-${hash}`,
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});
const zcashAccount = (utxos: ReturnType<typeof utxo>[]) =>
  ({
    id: "js:2:zcash:xpub:",
    currency: { id: "zcash" },
    bitcoinResources: { utxos },
  }) as unknown as ZcashAccount;
const prepared = (fields: Partial<Transaction>) =>
  tx({
    transferType: "transparent",
    zcashFee: new BigNumber(10_000),
    changeAmount: new BigNumber(20_000),
    ...fields,
  });
const built = (fee: number, sent: number, change = 0) =>
  ({
    fee,
    outputs: [
      { value: new BigNumber(sent), isChange: false },
      ...(change ? [{ value: new BigNumber(change), isChange: true }] : []),
    ],
  }) as unknown as TransactionInfo;

describe("buildPreparedLegacyTransaction", () => {
  it("pins the reviewed inputs, fee and amount, without recomputing the max spendable", async () => {
    buildTx.mockResolvedValueOnce(built(10_000, 70_000, 20_000));
    const preparedAccount = zcashAccount([utxo("small", 20_000), utxo("big", 80_000)]);

    await buildPreparedLegacyTransaction(
      logger,
      walletAccount,
      preparedAccount,
      prepared({ amount: new BigNumber(70_000), useAllAmount: true }),
    );

    const params = (buildTx.mock.calls[0] as unknown[])[1] as {
      amount: BigNumber;
      utxoPickingStrategy: FixedSelection;
      changeAddress: unknown;
    };
    expect(params.amount).toEqual(new BigNumber(70_000));
    expect(params.changeAddress).toBe(CHANGE);
    expect(params.utxoPickingStrategy).toBeInstanceOf(FixedSelection);
    // Largest first: the order the prepare step used.
    expect(params.utxoPickingStrategy).toMatchObject({
      outpoints: [
        { hash: "big", outputIndex: 0 },
        { hash: "small", outputIndex: 0 },
      ],
      needChangeOutput: true,
    });
    expect((params.utxoPickingStrategy as unknown as { fee: BigNumber }).fee).toEqual(
      new BigNumber(10_000),
    );
    expect(estimateAccountMaxSpendable).not.toHaveBeenCalled();
  });

  it("refuses a send that was not prepared", async () => {
    await expect(
      buildPreparedLegacyTransaction(
        logger,
        walletAccount,
        zcashAccount([]),
        tx({ transferType: "transparent" }),
      ),
    ).rejects.toBeInstanceOf(ZcashPreparedBuildMismatch);
    expect(buildTx).not.toHaveBeenCalled();
  });

  it("refuses when the built fee is not the reviewed one (change folded into the fee)", async () => {
    buildTx.mockResolvedValueOnce(built(30_000, 50_000));

    await expect(
      buildPreparedLegacyTransaction(
        logger,
        walletAccount,
        zcashAccount([utxo("a", 80_000)]),
        prepared({ amount: new BigNumber(50_000) }),
      ),
    ).rejects.toBeInstanceOf(ZcashPreparedBuildMismatch);
  });

  it("refuses when the recipient output is not the reviewed amount", async () => {
    buildTx.mockResolvedValueOnce(built(10_000, 49_000, 21_000));

    await expect(
      buildPreparedLegacyTransaction(
        logger,
        walletAccount,
        zcashAccount([utxo("a", 80_000)]),
        prepared({ amount: new BigNumber(50_000) }),
      ),
    ).rejects.toBeInstanceOf(ZcashPreparedBuildMismatch);
  });

  it("builds what prepareTransaction priced over several UTXOs, where Merge would pick fewer", async () => {
    const utxos = [utxo("u1", 100_000), utxo("u2", 100_000), utxo("u3", 100_000)];
    const preparedAccount = zcashAccount(utxos);
    const reviewed = await prepareTransaction(
      preparedAccount,
      tx({ transferType: "transparent", amount: new BigNumber(50_000) }),
    );
    // A single 100_000 UTXO would cover 50_000 (Merge); the review spent all three.
    expect(reviewed.zcashFee?.gt(0)).toBe(true);

    const storage = utxos.map(u => ({
      output_hash: u.hash,
      output_index: u.outputIndex,
      value: u.value.toString(),
    }));
    buildTx.mockImplementationOnce((async (_l: unknown, params: any) => {
      const xpub = {
        getXpubAddresses: async () => ["a"],
        storage: { getAddressUnspentUtxos: () => storage },
      };
      const picked = await params.utxoPickingStrategy.selectUnspentUtxosToUse(logger, xpub, [], 1);
      const change = picked.totalValue.minus(params.amount).minus(picked.fee);
      return {
        fee: picked.fee,
        outputs: [
          { value: params.amount, isChange: false },
          ...(picked.needChangeoutput ? [{ value: change, isChange: true }] : []),
        ],
        inputs: picked.unspentUtxos,
      };
    }) as never);

    const txInfo = await buildPreparedLegacyTransaction(
      logger,
      walletAccount,
      preparedAccount,
      reviewed,
    );

    expect(txInfo.inputs).toHaveLength(3);
    expect(txInfo.fee).toBe(reviewed.zcashFee!.toNumber());
    expect(txInfo.outputs[0].value).toEqual(reviewed.amount);
    expect(txInfo.outputs[1].value).toEqual(reviewed.changeAmount);
  });
});

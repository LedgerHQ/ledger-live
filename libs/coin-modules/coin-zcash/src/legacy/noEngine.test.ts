/**
 * Without the shielded engine, a send never loads it: the module that wraps the
 * native addon throws as soon as anything requires it, and every send step of a
 * transparent-only bridge still completes.
 */
import { BigNumber } from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "../types/bridge";
import type { BitcoinSigner, SignerContext } from "../types/signer";
import { testContext } from "../test/coinConfig";
import { createBridges } from "../bridge";
import { buildLegacyTransaction, resolveWalletAccount } from "./buildTransaction";

jest.mock("@ledgerhq/coin-zcash/network/ZCash", () => {
  throw new Error("the shielded engine was loaded");
});
jest.mock("./buildTransaction");
jest.mock("./fees", () => ({ zcashSafeFeePerByte: () => new BigNumber(40) }));
jest.mock("@ledgerhq/hw-app-btc/splitTransaction", () => ({ splitTransaction: () => ({}) }));
jest.mock("@ledgerhq/wallet-btc/index", () => ({
  ...jest.requireActual("@ledgerhq/wallet-btc/index"),
  __esModule: true,
  default: {
    estimateAccountMaxSpendable: async () => new BigNumber(100_000),
    broadcastTx: async () => "cc".repeat(32),
  },
}));

const mockResolveWalletAccount = resolveWalletAccount as jest.MockedFunction<
  typeof resolveWalletAccount
>;
const mockBuild = buildLegacyTransaction as jest.MockedFunction<typeof buildLegacyTransaction>;

const T1 = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const account = {
  type: "Account",
  id: "js:2:zcash:xpub:",
  currency: { id: "zcash", name: "Zcash" },
} as unknown as ZcashAccount;
const transaction = {
  family: "zcash",
  amount: new BigNumber(100_000),
  recipient: T1,
  transferType: "transparent",
  useAllAmount: false,
} as unknown as Transaction;

const txInfo = {
  inputs: [
    {
      txHex: "00",
      output_hash: "ab".repeat(32),
      output_index: 0,
      value: new BigNumber(160_000),
      address: T1,
      sequence: 0xffffffff,
      block_height: 1,
    },
  ],
  associatedDerivations: [[0, 0]],
  outputs: [
    { value: new BigNumber(100_000), address: T1, script: Buffer.alloc(25), isChange: false },
  ],
  fee: 10_000,
  changeAddress: { account: 1, index: 0, address: "" },
} as unknown as TransactionInfo;

const signerContext: SignerContext = (_deviceId, fn) =>
  fn({ createPaymentTransaction: async () => "signed-hex" } as unknown as BitcoinSigner);

beforeEach(() => {
  mockResolveWalletAccount.mockResolvedValue({
    params: { path: "44'/133'", index: 0 },
    xpub: {
      crypto: {},
      derivationMode: "",
      currentBlockHeight: 2,
      explorer: { fetchUtxoTx: async () => ({ outputs: [] }) },
    },
  } as unknown as Awaited<ReturnType<typeof resolveWalletAccount>>);
  mockBuild.mockResolvedValue({ txInfo, feePerByte: new BigNumber(40) });
});

describe("a transparent-only bridge", () => {
  const { accountBridge } = createBridges(signerContext, testContext, {
    isShieldedEnabled: () => false,
  });

  it("prices, checks, signs and broadcasts a send without loading the engine", async () => {
    const prepared = await accountBridge.prepareTransaction(account, transaction);
    expect(prepared.zcashFee?.toNumber()).toBe(10_000);

    const status = await accountBridge.getTransactionStatus(account, prepared);
    expect(status.errors).toEqual({});

    expect((await accountBridge.estimateMaxSpendable({ account })).toNumber()).toBe(100_000);

    const events = await firstValueFrom(
      accountBridge
        .signOperation({ account, deviceId: "d", transaction: prepared })
        .pipe(toArray()),
    );
    const signed = events.find(e => e.type === "signed");
    if (signed?.type !== "signed") throw new Error("expected a signed event");

    const operation = await accountBridge.broadcast({
      account,
      signedOperation: signed.signedOperation as SignedOperation,
    });
    expect((operation as Operation).hash).toBe("cc".repeat(32));
  });
});

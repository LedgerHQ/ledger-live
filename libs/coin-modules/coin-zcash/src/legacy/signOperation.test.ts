import { BigNumber } from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import type { BitcoinCreateTransactionLike } from "@ledgerhq/live-signer-zcash";
import type { Transaction, ZcashAccount } from "../types/bridge";
import type { BitcoinSigner, SignerContext } from "../types/signer";
import { testContext } from "../test/coinConfig";
import { LEGACY_MARGINAL_FEE } from "../logic/coin-selection";
import { buildLegacySignOperation, buildPreparedLegacySignOperation } from "./signOperation";
import {
  buildLegacyTransaction,
  buildPreparedLegacyTransaction,
  resolveWalletAccount,
} from "./buildTransaction";

jest.mock("./buildTransaction");
// Parsing is hw-app-btc's job; here the parsed shape only has to reach the signer.
jest.mock("@ledgerhq/hw-app-btc/splitTransaction", () => ({
  splitTransaction: jest.fn(() => ({ parsed: true })),
}));

const mockResolveWalletAccount = resolveWalletAccount as jest.MockedFunction<
  typeof resolveWalletAccount
>;
const mockBuildPrepared = buildPreparedLegacyTransaction as jest.MockedFunction<
  typeof buildPreparedLegacyTransaction
>;
const mockBuild = buildLegacyTransaction as jest.MockedFunction<typeof buildLegacyTransaction>;

const PREV_HASH = "ab".repeat(32);
const PREV_HEX = "0400008085202f89" + "00".repeat(40);

const txInfo = {
  inputs: [
    {
      txHex: PREV_HEX,
      output_hash: PREV_HASH,
      output_index: 1,
      value: new BigNumber(200_000),
      address: "t1sender",
      sequence: 0xffffffff,
      block_height: 3_400_000,
    },
  ],
  associatedDerivations: [[0, 4]],
  outputs: [
    {
      value: new BigNumber(100_000),
      address: "t1recipient",
      script: Buffer.from("76a914", "hex"),
      isChange: false,
    },
    {
      value: new BigNumber(90_000),
      address: "t1change",
      script: Buffer.from("76a915", "hex"),
      isChange: true,
    },
  ],
  fee: 10_000,
  changeAddress: { account: 1, index: 7, address: "t1change" },
} as unknown as TransactionInfo;

const account = { id: "js:2:zcash:xpub:", currency: { id: "zcash" } } as unknown as ZcashAccount;
const transaction = {
  family: "zcash",
  amount: new BigNumber(100_000),
  recipient: "t1recipient",
} as unknown as Transaction;

function makeSigner() {
  const createPaymentTransaction = jest.fn(async (arg: BitcoinCreateTransactionLike) => {
    arg.onDeviceSignatureRequested?.();
    arg.onDeviceSignatureGranted?.();
    return "signed-hex";
  });
  const signerContext: SignerContext = (_deviceId, fn) =>
    fn({ createPaymentTransaction } as unknown as BitcoinSigner);
  return { createPaymentTransaction, signerContext };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveWalletAccount.mockResolvedValue({
    params: { path: "44'/133'", index: 0 },
    xpub: { currentBlockHeight: 3_500_000 },
  } as unknown as Awaited<ReturnType<typeof resolveWalletAccount>>);
  mockBuild.mockResolvedValue({ txInfo, feePerByte: new BigNumber(40) });
});

describe("buildLegacySignOperation", () => {
  it.each([
    [3_590_098, "zcash", 5_000],
    [3_590_099, "zcash", 1_000],
    [0, "zcash_testnet", 1_000],
  ])(
    "builds an account at height %i on %s at %i per action",
    async (blockHeight, id, marginalFee) => {
      const { signerContext } = makeSigner();
      const acc = { ...account, currency: { id }, blockHeight } as unknown as ZcashAccount;

      await firstValueFrom(
        buildLegacySignOperation(
          signerContext,
          testContext,
        )({ account: acc, deviceId: "d", transaction }).pipe(toArray()),
      );

      expect(mockBuild).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        transaction,
        marginalFee,
      );
    },
  );

  it("asks the device to sign the built transaction as a Zcash transparent payment", async () => {
    const { createPaymentTransaction, signerContext } = makeSigner();

    await firstValueFrom(
      buildLegacySignOperation(
        signerContext,
        testContext,
      )({ account, deviceId: "d", transaction }).pipe(toArray()),
    );

    const arg = createPaymentTransaction.mock.calls[0][0];
    expect(arg.additionals).toEqual(["zcash", "sapling"]);
    expect(arg.inputs).toEqual([
      [{ parsed: true, rawTxHex: PREV_HEX }, 1, null, 0xffffffff, 3_400_000],
    ]);
    expect(arg.associatedKeysets).toEqual(["44'/133'/0'/0/4"]);
    expect(arg.changePath).toBe("44'/133'/0'/1/7");
    expect(arg.blockHeight).toBe(3_500_000);
    expect(arg.expiryHeight).toEqual(Buffer.alloc(4));
    expect(arg.sigHashType).toBe(1);
    expect(arg.network).toBe("mainnet");
  });

  it("signs a zcash_testnet payment against the testnet network", async () => {
    const { createPaymentTransaction, signerContext } = makeSigner();
    const testnetAccount = {
      ...account,
      currency: { id: "zcash_testnet" },
    } as unknown as ZcashAccount;

    await firstValueFrom(
      buildLegacySignOperation(
        signerContext,
        testContext,
      )({ account: testnetAccount, deviceId: "d", transaction }).pipe(toArray()),
    );

    expect(createPaymentTransaction.mock.calls[0][0].network).toBe("testnet");
  });

  it("reports the device steps and returns an outgoing operation carrying its inputs", async () => {
    const { signerContext } = makeSigner();

    const events = await firstValueFrom(
      buildLegacySignOperation(
        signerContext,
        testContext,
      )({ account, deviceId: "d", transaction }).pipe(toArray()),
    );

    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
    const signed = events[2];
    if (signed.type !== "signed") throw new Error("expected a signed event");
    const { operation, signature } = signed.signedOperation;
    expect(signature).toBe("signed-hex");
    expect(operation.type).toBe("OUT");
    expect(operation.fee.toNumber()).toBe(10_000);
    expect(operation.value.toNumber()).toBe(110_000);
    expect(operation.senders).toEqual(["t1sender"]);
    expect(operation.recipients).toEqual(["t1recipient"]);
    expect(operation.extra).toEqual({
      inputs: [`${PREV_HASH}-1`],
      inputRefs: [{ hash: PREV_HASH, outputIndex: 1, address: "t1sender" }],
    });
  });

  it("errors when the build fails", async () => {
    mockBuild.mockRejectedValue(new Error("NotEnoughBalance"));
    const { signerContext } = makeSigner();

    await expect(
      firstValueFrom(
        buildLegacySignOperation(
          signerContext,
          testContext,
        )({ account, deviceId: "d", transaction }),
      ),
    ).rejects.toThrow("NotEnoughBalance");
  });
});

describe("buildPreparedLegacySignOperation", () => {
  it("signs the prepared build, not the wallet-btc selection", async () => {
    mockBuildPrepared.mockResolvedValue(txInfo);
    const { createPaymentTransaction, signerContext } = makeSigner();

    const events = await firstValueFrom(
      buildPreparedLegacySignOperation(
        signerContext,
        testContext,
      )({ account, deviceId: "d", transaction }).pipe(toArray()),
    );

    expect(mockBuildPrepared).toHaveBeenCalledWith(
      testContext.logger,
      expect.anything(),
      account,
      transaction,
      LEGACY_MARGINAL_FEE,
    );
    expect(mockBuild).not.toHaveBeenCalled();
    expect(createPaymentTransaction.mock.calls[0][0].additionals).toEqual(["zcash", "sapling"]);
    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
    const signed = events[2];
    if (signed.type !== "signed") throw new Error("expected a signed event");
    expect(signed.signedOperation.operation.extra).toEqual({
      inputs: [`${PREV_HASH}-1`],
      inputRefs: [{ hash: PREV_HASH, outputIndex: 1, address: "t1sender" }],
    });
  });

  it("does not reach the device when the send is dismissed while it builds", async () => {
    let resolveBuild: ((info: TransactionInfo) => void) | undefined;
    mockBuildPrepared.mockReturnValue(
      new Promise<TransactionInfo>(resolve => {
        resolveBuild = resolve;
      }),
    );
    const { createPaymentTransaction, signerContext } = makeSigner();
    const next = jest.fn();
    const error = jest.fn();

    const subscription = buildPreparedLegacySignOperation(
      signerContext,
      testContext,
    )({ account, deviceId: "d", transaction }).subscribe({ next, error });
    await new Promise(process.nextTick);
    expect(mockBuildPrepared).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
    resolveBuild?.(txInfo);
    await new Promise(process.nextTick);

    expect(createPaymentTransaction).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("surfaces a build refusal as the observable error, without reaching the device", async () => {
    mockBuildPrepared.mockRejectedValue(new Error("mismatch"));
    const { createPaymentTransaction, signerContext } = makeSigner();

    await expect(
      firstValueFrom(
        buildPreparedLegacySignOperation(
          signerContext,
          testContext,
        )({ account, deviceId: "d", transaction }),
      ),
    ).rejects.toThrow("mismatch");
    expect(createPaymentTransaction).not.toHaveBeenCalled();
  });
});

import BigNumber from "bignumber.js";
import { craftTransaction } from "../logic/craftTransaction";
import { combine } from "../logic/combine";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import * as logicUtils from "../logic/utils";
import { buildSignOperation } from "./signOperation";

jest.mock("../logic/craftTransaction", () => ({
  craftTransaction: jest.fn(),
}));

jest.mock("../logic/combine", () => ({
  combine: jest.fn(),
}));

jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  serializeSignature: jest.fn(() => "serialized-signature"),
  serializeTransaction: jest.fn(() => "serialized-transaction"),
  getHederaTransactionBodyBytes: jest.fn(() => new Uint8Array([1, 2, 3])),
  isTokenAssociateTransaction: jest.fn(() => false),
  isStakingTransaction: jest.fn(() => false),
}));

const buildSignerContext = () =>
  jest.fn(async (_deviceId: string, fn: (signer: unknown) => Promise<string>) => {
    const signer = { signTransaction: jest.fn(async () => new Uint8Array([9, 9, 9])) };
    return await fn(signer);
  });

const runSignOperation = (
  account: ReturnType<typeof getMockedAccount>,
  transaction: ReturnType<typeof getMockedTransaction>,
) =>
  new Promise<void>((resolve, reject) => {
    const signerContext = buildSignerContext();
    const signOperation = buildSignOperation(signerContext as never);
    signOperation({ account, transaction, deviceId: "test-device" }).subscribe({
      complete: () => resolve(),
      error: (err: unknown) => reject(err),
    });
  });

describe("signOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(logicUtils.isTokenAssociateTransaction).mockReturnValue(false);
    jest.mocked(logicUtils.isStakingTransaction).mockReturnValue(false);
  });

  it("passes hedera coin config to craftTransaction", async () => {
    const account = getMockedAccount();
    const transaction = getMockedTransaction();

    jest
      .mocked(craftTransaction)
      .mockResolvedValue({ tx: {} as never, serializedTx: "serialized-tx" });
    jest.mocked(combine).mockReturnValue("combined-signature");

    const signerContext = jest.fn(
      async (_deviceId: string, fn: (signer: any) => Promise<string>) => {
        const signer = {
          signTransaction: jest.fn(async () => new Uint8Array([9, 9, 9])),
        };

        return await fn(signer);
      },
    );

    const signOperation = buildSignOperation(signerContext as never);

    await new Promise<void>((resolve, reject) => {
      signOperation({ account, transaction, deviceId: "test-device" }).subscribe({
        complete: () => resolve(),
        error: err => reject(err),
      });
    });

    expect(craftTransaction).toHaveBeenCalledTimes(1);
    expect(craftTransaction).toHaveBeenCalledWith({
      txIntent: expect.any(Object),
      configOrCurrencyId: account.currency.id,
    });
    expect(combine).toHaveBeenCalledTimes(1);
  });

  it("builds HTS token asset when subAccount has tokenType hts", async () => {
    const htsToken = getMockedHTSTokenCurrency();
    const tokenAccount = getMockedTokenAccount(htsToken, { id: "ta-hts" });
    const account = getMockedAccount({ subAccounts: [tokenAccount] });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Send,
      subAccountId: tokenAccount.id,
    });

    jest
      .mocked(craftTransaction)
      .mockResolvedValue({ tx: {} as never, serializedTx: "serialized-tx" });
    jest.mocked(combine).mockReturnValue("combined-signature");

    await runSignOperation(account, transaction);

    expect(craftTransaction).toHaveBeenCalledTimes(1);
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        txIntent: expect.objectContaining({
          asset: expect.objectContaining({
            type: "hts",
            assetReference: htsToken.contractAddress,
            assetOwner: account.freshAddress,
          }),
        }),
      }),
    );
  });

  it("builds ERC20 token asset with gasLimit data when subAccount has tokenType erc20", async () => {
    const erc20Token = getMockedERC20TokenCurrency();
    const tokenAccount = getMockedTokenAccount(erc20Token, { id: "ta-erc20" });
    const account = getMockedAccount({ subAccounts: [tokenAccount] });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Send,
      subAccountId: tokenAccount.id,
    });

    jest
      .mocked(craftTransaction)
      .mockResolvedValue({ tx: {} as never, serializedTx: "serialized-tx" });
    jest.mocked(combine).mockReturnValue("combined-signature");

    await runSignOperation(account, transaction);

    expect(craftTransaction).toHaveBeenCalledTimes(1);
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        txIntent: expect.objectContaining({
          asset: expect.objectContaining({
            type: "erc20",
            assetReference: erc20Token.contractAddress,
            assetOwner: account.freshAddress,
          }),
          data: expect.objectContaining({ type: "erc20", gasLimit: expect.anything() }),
        }),
      }),
    );
  });

  it("builds staking asset with stakingNodeId data when isStakingTransaction returns true", async () => {
    const account = getMockedAccount();
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: { stakingNodeId: 7 },
    });

    jest.mocked(logicUtils.isStakingTransaction).mockReturnValue(true as never);
    jest
      .mocked(craftTransaction)
      .mockResolvedValue({ tx: {} as never, serializedTx: "serialized-tx" });
    jest.mocked(combine).mockReturnValue("combined-signature");

    await runSignOperation(account, transaction);

    expect(craftTransaction).toHaveBeenCalledTimes(1);
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        txIntent: expect.objectContaining({
          asset: { type: "native" },
          data: expect.objectContaining({ type: "staking", stakingNodeId: 7 }),
        }),
      }),
    );
  });

  it("builds TokenAssociate asset when isTokenAssociateTransaction returns true", async () => {
    const htsToken = getMockedHTSTokenCurrency();
    const account = getMockedAccount();
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      assetReference: htsToken.contractAddress,
      assetOwner: account.freshAddress,
      properties: { token: htsToken },
    });

    jest.mocked(logicUtils.isTokenAssociateTransaction).mockReturnValue(true as never);
    jest
      .mocked(craftTransaction)
      .mockResolvedValue({ tx: {} as never, serializedTx: "serialized-tx" });
    jest.mocked(combine).mockReturnValue("combined-signature");

    await runSignOperation(account, transaction);

    expect(craftTransaction).toHaveBeenCalledTimes(1);
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        txIntent: expect.objectContaining({
          type: HEDERA_TRANSACTION_MODES.TokenAssociate,
          asset: expect.objectContaining({ assetReference: htsToken.contractAddress }),
        }),
      }),
    );
  });

  it("passes customFees to craftTransaction when transaction.maxFee is set", async () => {
    const account = getMockedAccount();
    const maxFee = new BigNumber(5000);
    const transaction = getMockedTransaction({ maxFee });

    jest
      .mocked(craftTransaction)
      .mockResolvedValue({ tx: {} as never, serializedTx: "serialized-tx" });
    jest.mocked(combine).mockReturnValue("combined-signature");

    await runSignOperation(account, transaction);

    expect(craftTransaction).toHaveBeenCalledTimes(1);
    expect(craftTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        customFees: { value: BigInt(maxFee.toString()) },
      }),
    );
  });

  it("propagates signerContext errors to the Observable", async () => {
    const account = getMockedAccount();
    const transaction = getMockedTransaction();
    const thrown = new Error("device disconnected");

    const signerContext = jest.fn(() => Promise.reject(thrown));
    const signOperation = buildSignOperation(signerContext as never);

    const error = await new Promise<unknown>(resolve => {
      signOperation({ account, transaction, deviceId: "test-device" }).subscribe({
        complete: () => resolve(undefined),
        error: err => resolve(err),
      });
    });

    expect(error).toBe(thrown);
  });
});

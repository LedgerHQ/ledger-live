import { addPendingOperation } from "@ledgerhq/ledger-wallet-framework/account/pending";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonCoinConfig, CantonContext } from "../config";
import { getCalTokensCached, prepareTransferRequest, submit } from "../network/gateway";
import {
  configOfCall,
  createMockCantonAccount,
  createMockCantonSigner,
  createMockCoinConfigValue,
  createMockContext,
  createMockPrepareTransferResponse,
  createMockSignerContext,
  createMockTokenAccount,
  createMockTransaction,
} from "../test/fixtures";
import type { CantonSigner, Transaction } from "../types";
import { CantonInvalidConfigError } from "../types/errors";
import { broadcast } from "./broadcast";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";

jest.mock("../network/gateway", () => ({
  ...jest.requireActual("../network/gateway"),
  getCalTokensCached: jest.fn(),
  prepareTransferRequest: jest.fn(),
  submit: jest.fn(),
}));

const mockedPrepare = jest.mocked(prepareTransferRequest);
const mockedSubmit = jest.mocked(submit);

const ID_PARTY = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const XPUB_PARTY = "bob::122014d3f17b82700d15bef451bcb1d112136eb82bb3f4fd2a4649f95a9c4632b000";
const config = createMockCoinConfigValue();
// A synced account keeps the device address apart from the party, which lives in `xpub`.
const account = createMockCantonAccount({ freshAddress: "canton_0123abcd", xpub: XPUB_PARTY });
const nativeTransaction = createMockTransaction({ tokenId: config.nativeInstrumentId });

function sign(
  transaction: Transaction,
  {
    signedAccount = account,
    context = createMockContext(config),
    signer = createMockCantonSigner() as CantonSigner,
  }: { signedAccount?: Account; context?: CantonContext; signer?: CantonSigner } = {},
): Promise<SignedOperation> {
  const signOperation = buildSignOperation(createMockSignerContext(signer), context);
  return new Promise((resolve, reject) => {
    signOperation({ account: signedAccount, deviceId: "device", transaction }).subscribe({
      next: event => {
        if (event.type === "signed") resolve(event.signedOperation);
      },
      error: reject,
    });
  });
}

const preparedRequest = () => mockedPrepare.mock.calls[0][2];

describe("buildSignOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrepare.mockResolvedValue(createMockPrepareTransferResponse({ hash: "prepare-hash" }));
  });

  it("should prepare a native transfer expiring in one day when no expiry is set", async () => {
    await sign(nativeTransaction);

    expect(mockedPrepare).toHaveBeenCalledWith(expect.anything(), XPUB_PARTY, {
      type: "token-transfer-request",
      recipient: nativeTransaction.recipient,
      amount: "100",
      execute_before_secs: 24 * 60 * 60,
      instrument_id: config.nativeInstrumentId,
    });
  });

  it("should prepare with the transaction's expiry when it has one", async () => {
    await sign({ ...nativeTransaction, expireInSeconds: 3 * 60 * 60 });

    expect(preparedRequest().execute_before_secs).toBe(3 * 60 * 60);
  });

  it("should keep the admin of a native transfer that carries one", async () => {
    await sign({ ...nativeTransaction, instrumentAdmin: "dso::1220" });

    expect(preparedRequest()).toMatchObject({
      instrument_id: config.nativeInstrumentId,
      instrument_admin: "dso::1220",
    });
  });

  it("should prepare a token transfer with its instrument id and admin", async () => {
    await sign(createMockTransaction({ tokenId: "USDCx", instrumentAdmin: "issuer::1220" }));

    expect(preparedRequest()).toMatchObject({
      instrument_id: "USDCx",
      instrument_admin: "issuer::1220",
    });
  });

  it("should sign a token Send max for the whole token balance with its instrument", async () => {
    jest.mocked(getCalTokensCached).mockResolvedValue(new Map([["canton_network/usdcx", "USDCx"]]));
    const tenthOfAToken = new BigNumber(10).pow(37);
    const tokenAccount = createMockTokenAccount({ spendableBalance: tenthOfAToken });
    const parent = { ...account, subAccounts: [tokenAccount] };
    const prepared = await prepareTransaction(
      createMockContext({ ...config, fee: 0 }),
      parent,
      createMockTransaction({
        amount: new BigNumber(0),
        useAllAmount: true,
        subAccountId: tokenAccount.id,
      }),
    );

    await sign(prepared, { signedAccount: parent });

    expect(preparedRequest()).toMatchObject({
      amount: tenthOfAToken.toFixed(),
      instrument_id: "USDCx",
      instrument_admin: "issuer::1220",
    });
  });

  it("should send the memo as the transfer reason", async () => {
    await sign({ ...nativeTransaction, memo: "invoice 42" });

    expect(preparedRequest().reason).toBe("invoice 42");
  });

  it("should fall back to the party of the account id when the account has no xpub", async () => {
    await sign(nativeTransaction, {
      signedAccount: createMockCantonAccount({ freshAddress: "canton_0123abcd" }),
    });

    expect(mockedPrepare.mock.calls[0][1]).toBe(ID_PARTY);
  });

  it("should prepare with the config of the account's currency", async () => {
    const accountCurrencyConfig: CantonCoinConfig = {
      ...config,
      gatewayUrl: "https://account.test",
    };
    const context: CantonContext = {
      config: async currencyId =>
        currencyId === account.currency.id ? accountCurrencyConfig : createMockCoinConfigValue(),
      logger: () => {},
    };

    await sign(nativeTransaction, { context });

    await expect(configOfCall(mockedPrepare.mock.calls[0])).resolves.toBe(accountCurrencyConfig);
    await expect(mockedPrepare.mock.calls[0][0].config("other")).resolves.toBe(
      accountCurrencyConfig,
    );
  });

  it("should hand the device the split transaction, never a string", async () => {
    const signer = createMockCantonSigner();
    const signTransaction = jest.spyOn(signer, "signTransaction");

    await sign(nativeTransaction, { signer });

    expect(signTransaction).toHaveBeenCalledWith(
      account.freshAddressPath,
      expect.objectContaining({ damlTransaction: expect.any(Uint8Array) }),
    );
  });

  it("should sign for the party without smuggling it through the signature", async () => {
    const { signature } = await sign(nativeTransaction);

    expect(JSON.parse(signature)).toEqual({
      party: XPUB_PARTY,
      serialized: createMockPrepareTransferResponse().serialized,
      signature: expect.stringMatching(/^[0-9a-f]+$/i),
    });
  });

  it("should identify the operation by the prepare hash until broadcast returns the update id", async () => {
    mockedSubmit.mockResolvedValue({ submission_id: "submission", update_id: "update-id" });

    const signedOperation = await sign(nativeTransaction);
    const broadcasted = await broadcast(createMockContext(config), { account, signedOperation });

    expect(signedOperation.operation).toMatchObject({
      hash: "prepare-hash",
      id: encodeOperationId(account.id, "prepare-hash", "OUT"),
    });
    expect(broadcasted).toMatchObject({
      hash: "update-id",
      id: encodeOperationId(account.id, "update-id", "OUT"),
      transactionSequenceNumber: signedOperation.operation.transactionSequenceNumber,
    });
    const { signature } = JSON.parse(signedOperation.signature);
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.anything(),
      XPUB_PARTY,
      createMockPrepareTransferResponse().serialized,
      signature,
    );
  });

  it("should give the optimistic operation a sequence number above the account's pending ones", async () => {
    const pending = { transactionSequenceNumber: BigNumber(Date.now() + 60_000) } as Operation;

    const { operation } = await sign(nativeTransaction, {
      signedAccount: { ...account, pendingOperations: [pending] },
    });

    expect(operation.transactionSequenceNumber).toEqual(pending.transactionSequenceNumber?.plus(1));
  });

  it("should charge a native send's fee in its value, sent by the party", async () => {
    const { operation } = await sign(nativeTransaction);

    expect(operation).toMatchObject({
      accountId: account.id,
      type: "OUT",
      value: BigNumber(110),
      fee: BigNumber(10),
      senders: [XPUB_PARTY],
    });
  });

  describe("of a token send", () => {
    const subAccountId = `${account.id}+token`;
    const tokenAccount = {
      ...account,
      subAccounts: [{ type: "TokenAccount", id: subAccountId, pendingOperations: [] }],
    } as unknown as Account;
    const tokenTransaction = createMockTransaction({
      tokenId: "USDCx",
      instrumentAdmin: "issuer",
      subAccountId,
    });

    it("should be a CC FEES operation on the parent, with the token's OUT as a sub-operation", async () => {
      mockedSubmit.mockResolvedValue({ submission_id: "submission", update_id: "update-id" });
      const signedOperation = await sign(tokenTransaction, { signedAccount: tokenAccount });
      const operation = await broadcast(createMockContext(config), {
        account: tokenAccount,
        signedOperation,
      });

      expect(operation).toMatchObject({
        id: encodeOperationId(account.id, "update-id", "FEES"),
        accountId: account.id,
        type: "FEES",
        value: BigNumber(10),
        fee: BigNumber(10),
        subOperations: [
          {
            id: encodeOperationId(subAccountId, "update-id", "OUT"),
            hash: "update-id",
            accountId: subAccountId,
            type: "OUT",
            value: BigNumber(100),
            fee: BigNumber(0),
            transactionSequenceNumber: operation.transactionSequenceNumber,
          },
        ],
      });
    });

    const send = async (sender: Account) =>
      addPendingOperation(
        sender,
        (await sign(tokenTransaction, { signedAccount: sender })).operation,
      );

    it.each([
      ["the token", tokenTransaction],
      ["CC", createMockTransaction({ tokenId: config.nativeInstrumentId, subAccountId })],
    ])("should refuse to sign %s for a token account that is gone", async (_, transaction) => {
      await expect(sign(transaction)).rejects.toThrow(InvalidTransactionError);
      expect(mockedPrepare).not.toHaveBeenCalled();
    });

    it("should charge the CC fee alone for a token sent without a token account", async () => {
      const { subAccountId: _, ...withoutTokenAccount } = tokenTransaction;

      const { operation } = await sign(withoutTokenAccount as Transaction);

      expect(operation).toMatchObject({ type: "FEES", value: BigNumber(10), subOperations: [] });
    });

    it("should number the operation above a pending token operation", async () => {
      const subPending = { transactionSequenceNumber: BigNumber(Date.now() + 60_000) };
      const sender = {
        ...tokenAccount,
        subAccounts: [{ ...tokenAccount.subAccounts?.[0], pendingOperations: [subPending] }],
      } as unknown as Account;

      const { operation } = await sign(tokenTransaction, { signedAccount: sender });

      expect(operation.transactionSequenceNumber).toEqual(
        subPending.transactionSequenceNumber.plus(1),
      );
    });

    it("should be pending on the token account, keeping an earlier token send", async () => {
      const afterSecond = await send(await send(tokenAccount));

      expect(afterSecond.pendingOperations).toHaveLength(2);
      expect(afterSecond.subAccounts?.[0].pendingOperations).toHaveLength(2);
    });
  });

  it("should fail the broadcast when the gateway returns no update id", async () => {
    mockedSubmit.mockResolvedValue({ submission_id: "submission" } as Awaited<
      ReturnType<typeof submit>
    >);

    const signedOperation = await sign(nativeTransaction);

    await expect(
      broadcast(createMockContext(config), { account, signedOperation }),
    ).rejects.toThrow("canton: broadcast returned no transaction id");
  });

  it("should map and craft from a single config read when the config changes between reads", async () => {
    const reads = [config, { ...config, nativeInstrumentId: "OtherInstrument" }];
    const context: CantonContext = {
      config: async () => reads.shift() ?? createMockCoinConfigValue(),
      logger: () => {},
    };

    await sign(nativeTransaction, { context });

    expect(preparedRequest().instrument_id).toBe(config.nativeInstrumentId);
  });

  it("should keep the class of an invalid config error", async () => {
    mockedPrepare.mockRejectedValue(new CantonInvalidConfigError("canton: coin config gatewayUrl"));

    await expect(sign(nativeTransaction)).rejects.toThrow(CantonInvalidConfigError);
  });

  it("should still wrap a device error by its result message", async () => {
    mockedPrepare.mockRejectedValue(
      Object.assign(new Error("generic"), { data: { resultMessage: "device message" } }),
    );

    await expect(sign(nativeTransaction)).rejects.toThrow("device message");
  });
});

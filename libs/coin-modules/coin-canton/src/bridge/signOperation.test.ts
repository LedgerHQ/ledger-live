import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import type { CantonCoinConfig, CantonContext } from "../config";
import { prepareTransferRequest, submit } from "../network/gateway";
import {
  createMockCantonAccount,
  createMockCantonSigner,
  createMockCoinConfigValue,
  createMockContext,
  createMockPrepareTransferResponse,
  createMockSignerContext,
  createMockTransaction,
} from "../test/fixtures";
import type { CantonSigner, Transaction } from "../types";
import { broadcast } from "./broadcast";
import { buildSignOperation } from "./signOperation";

jest.mock("../network/gateway", () => ({
  ...jest.requireActual("../network/gateway"),
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

    expect(mockedPrepare).toHaveBeenCalledWith(config, XPUB_PARTY, {
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

    expect(mockedPrepare.mock.calls[0][0]).toBe(accountCurrencyConfig);
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
    });
    const { signature } = JSON.parse(signedOperation.signature);
    expect(mockedSubmit).toHaveBeenCalledWith(
      config,
      XPUB_PARTY,
      createMockPrepareTransferResponse().serialized,
      signature,
    );
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
});

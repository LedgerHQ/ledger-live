import { NetworkDown } from "@ledgerhq/errors";
import { Memo } from "@stellar/stellar-sdk";
import { getRecipientAccount, loadAccount } from "../network";
import { StellarAssetRequired, StellarMuxedAccountNotExist } from "../types";
import { craftTransaction } from "./craftTransaction";
import {
  buildChangeTrustOperation,
  buildCreateAccountOperation,
  buildPaymentOperation,
  buildTransactionBuilder,
} from "./sdkWrapper";

jest.mock("../network", () => ({
  loadAccount: jest.fn(),
  getRecipientAccount: jest.fn(),
}));

jest.mock("./sdkWrapper", () => ({
  buildChangeTrustOperation: jest.fn(),
  buildCreateAccountOperation: jest.fn(),
  buildPaymentOperation: jest.fn(),
  buildTransactionBuilder: jest.fn(),
}));

describe("craftTransaction", () => {
  const account = { address: "GABC" };
  const transaction = {
    type: "payment",
    recipient: "GRECIPIENT",
    amount: 10000000n,
    fee: 100n,
  };

  const craftedTransaction = {
    toXDR: jest.fn().mockReturnValue("tx-xdr"),
    signatureBase: jest.fn().mockReturnValue(Buffer.from("signature-base")),
  };

  const txBuilder = {
    addOperation: jest.fn(),
    addMemo: jest.fn(),
    setTimeout: jest.fn(),
    build: jest.fn().mockReturnValue(craftedTransaction),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    txBuilder.setTimeout.mockReturnValue(txBuilder);
    (buildTransactionBuilder as jest.Mock).mockReturnValue(txBuilder);
    (loadAccount as jest.Mock).mockResolvedValue({ id: "source-account" });
    (getRecipientAccount as jest.Mock).mockResolvedValue({
      id: "GRECIPIENT",
      isMuxedAccount: false,
    });
    (buildPaymentOperation as jest.Mock).mockReturnValue("payment-op");
    (buildCreateAccountOperation as jest.Mock).mockReturnValue("create-account-op");
    (buildChangeTrustOperation as jest.Mock).mockReturnValue("change-trust-op");
  });

  it("throws NetworkDown when source account cannot be loaded", async () => {
    (loadAccount as jest.Mock).mockResolvedValue(null);

    await expect(craftTransaction(account, transaction)).rejects.toThrow(NetworkDown);
  });

  it("throws StellarAssetRequired for changeTrust without asset code and issuer", async () => {
    await expect(
      craftTransaction(account, {
        ...transaction,
        type: "changeTrust",
        assetCode: undefined,
        assetIssuer: undefined,
      }),
    ).rejects.toThrow(StellarAssetRequired);
  });

  it("builds a changeTrust operation when type is changeTrust", async () => {
    const result = await craftTransaction(account, {
      ...transaction,
      type: "changeTrust",
      assetCode: "USDC",
      assetIssuer: "GISSUER",
    });

    expect(buildChangeTrustOperation).toHaveBeenCalledWith("USDC", "GISSUER");
    expect(txBuilder.addOperation).toHaveBeenCalledWith("change-trust-op");
    expect(getRecipientAccount).not.toHaveBeenCalled();
    expect(result.xdr).toBe("tx-xdr");
    expect(result.signatureBase).toBe("c2lnbmF0dXJlLWJhc2U=");
  });

  it("builds a payment operation and memo when recipient exists", async () => {
    const memoTextSpy = jest.spyOn(Memo, "text");

    await craftTransaction(account, {
      ...transaction,
      memoType: "MEMO_TEXT",
      memoValue: "hello",
    });

    expect(buildPaymentOperation).toHaveBeenCalledWith({
      destination: "GRECIPIENT",
      amount: 10000000n,
      assetCode: undefined,
      assetIssuer: undefined,
    });
    expect(txBuilder.addOperation).toHaveBeenCalledWith("payment-op");
    expect(memoTextSpy).toHaveBeenCalledWith("hello");
    expect(txBuilder.addMemo).toHaveBeenCalledTimes(1);
  });

  it("throws StellarMuxedAccountNotExist when missing muxed recipient account", async () => {
    (getRecipientAccount as jest.Mock).mockResolvedValue({ id: null, isMuxedAccount: true });

    await expect(craftTransaction(account, transaction)).rejects.toThrow(
      StellarMuxedAccountNotExist,
    );
  });

  it("builds createAccount operation when recipient does not exist and is not muxed", async () => {
    (getRecipientAccount as jest.Mock).mockResolvedValue({ id: null, isMuxedAccount: false });

    await craftTransaction(account, transaction);

    expect(buildCreateAccountOperation).toHaveBeenCalledWith("GRECIPIENT", 10000000n);
    expect(txBuilder.addOperation).toHaveBeenCalledWith("create-account-op");
  });
});

import { setup, getMockedUtils, getMockedBridgeHelpers } from "../test/jest.mocks";
setup();
import { Expiry, SubmitRequestType } from "@zondax/ledger-live-icp/agent";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { buildSignOperation } from "./signOperation";
import { ICPAccount, Transaction, ICPSigner } from "../types";
import { getEmptyAccount, SAMPLE_PUBLIC_KEY } from "../test/__fixtures__";
import {
  UnsignedTransaction,
  TransferRawRequest,
  createUnsignedSendTransaction,
  createUnsignedListNeuronsTransaction,
  createUnsignedNeuronCommandTransaction,
  createReadStateRequest,
} from "@zondax/ledger-live-icp/utils";
import { Principal } from "@zondax/ledger-live-icp";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";

describe("buildSignOperation", () => {
  let signerContext: SignerContext<ICPSigner>;
  let account: ICPAccount;
  const deviceId = "dummyDeviceId";
  let sign: jest.Mock;
  let signUpdateCall: jest.Mock;

  beforeAll(() => {
    const { addresses, buildOptimisticOperation } = getMockedBridgeHelpers();
    (addresses.getAddress as jest.Mock).mockReturnValue({
      derivationPath: "44'/223'/0'/0/0",
      address: "mock-address",
    });
    (buildOptimisticOperation.buildOptimisticSendOperation as jest.Mock).mockImplementation(
      async (account: Account, transaction: Transaction, hash?: string) => ({
        id: `op-id-${hash ?? ""}`,
        hash: hash ?? "default-hash",
        type: "OUT",
        value: transaction.amount.plus(transaction.fees ?? 0),
        fee: transaction.fees,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        blockHeight: null,
        blockHash: null,
        accountId: account.id,
        date: new Date(),
        extra: {
          memo: transaction.memo,
          methodName: transaction.type,
        },
      }),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    account = {
      ...getEmptyAccount(getCryptoCurrencyById("internet_computer")),
      xpub: SAMPLE_PUBLIC_KEY,
    };

    sign = jest.fn().mockResolvedValue({
      signatureRS: Buffer.from("mock-signature-rs"),
    });
    signUpdateCall = jest.fn().mockResolvedValue({
      RequestSignatureRS: Buffer.from("mock-request-signature-rs"),
      StatusReadSignatureRS: Buffer.from("mock-status-read-signature-rs"),
    });

    signerContext = jest.fn((_deviceId: string, fn: (signer: ICPSigner) => Promise<any>) =>
      fn({ sign, signUpdateCall } as unknown as ICPSigner),
    ) as SignerContext<ICPSigner>;
  });

  it("should sign a 'send' transaction", done => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber("100000000"),
      recipient: "test-recipient",
      fees: new BigNumber("10000"),
      memo: "test-memo",
    };
    const unsignedTx: UnsignedTransaction = {
      request_type: SubmitRequestType.Call,
      canister_id: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"),
      method_name: "send_dfx",
      arg: Buffer.from(""),
      sender: Principal.fromText("aaaaa-aa"),
      ingress_expiry: new Expiry(0),
    };
    const transferRawRequest: TransferRawRequest = {
      to: Buffer.from("test-recipient-bytes"),
      from_subaccount: [],
      amount: { e8s: 100000000n },
      fee: { e8s: 10000n },
      memo: 12345n,
      created_at_time: [{ timestamp_nanos: 1620000000000000000n }],
    };
    (createUnsignedSendTransaction as jest.Mock).mockReturnValue({
      unsignedTransaction: unsignedTx,
      transferRawRequest,
    });
    const { hashTransaction } = getMockedUtils();
    hashTransaction.mockReturnValue("tx-hash");

    const signOperation = buildSignOperation(signerContext);

    const observable = signOperation({ account, transaction, deviceId });

    let step = 0;
    observable.subscribe({
      next: (event: any) => {
        switch (step) {
          case 0:
            expect(event.type).toBe("device-signature-requested");
            break;
          case 1:
            expect(event.type).toBe("device-signature-granted");
            break;
          case 2:
            expect(event.type).toBe("signed");
            expect(event.signedOperation.signature).toBe(
              Buffer.from("mock-signature-rs").toString("hex"),
            );
            expect(event.signedOperation.rawData.methodName).toBe("send");
            expect(event.signedOperation.operation.id).toBe("op-id-tx-hash");
            break;
        }
        step++;
      },
      complete: () => {
        expect(signerContext).toHaveBeenCalled();
        expect(createUnsignedSendTransaction).toHaveBeenCalledWith(transaction, account.xpub);
        done();
      },
      error: err => done(err),
    });
  });

  it("should sign a 'create_neuron' transaction", done => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "create_neuron",
      amount: new BigNumber("100000000"),
      recipient: "test-recipient",
      fees: new BigNumber("10000"),
      memo: "test-memo",
    };
    const unsignedTx: UnsignedTransaction = {
      request_type: SubmitRequestType.Call,
      canister_id: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"),
      method_name: "send_dfx",
      arg: Buffer.from(""),
      sender: Principal.fromText("aaaaa-aa"),
      ingress_expiry: new Expiry(0),
    };
    const transferRawRequest: TransferRawRequest = {
      to: Buffer.from("test-recipient-bytes"),
      from_subaccount: [],
      amount: { e8s: 100000000n },
      fee: { e8s: 10000n },
      memo: 12345n,
      created_at_time: [{ timestamp_nanos: 1620000000000000000n }],
    };
    (createUnsignedSendTransaction as jest.Mock).mockReturnValue({
      unsignedTransaction: unsignedTx,
      transferRawRequest,
    });
    const { hashTransaction } = getMockedUtils();
    hashTransaction.mockReturnValue("tx-hash-create-neuron");

    const signOperation = buildSignOperation(signerContext);

    const observable = signOperation({ account, transaction, deviceId });

    let step = 0;
    observable.subscribe({
      next: (event: any) => {
        switch (step) {
          case 0:
            expect(event.type).toBe("device-signature-requested");
            break;
          case 1:
            expect(event.type).toBe("device-signature-granted");
            break;
          case 2:
            expect(event.type).toBe("signed");
            expect(event.signedOperation.signature).toBe(
              Buffer.from("mock-signature-rs").toString("hex"),
            );
            expect(event.signedOperation.rawData.methodName).toBe("create_neuron");
            expect(event.signedOperation.operation.id).toBe("op-id-tx-hash-create-neuron");
            break;
        }
        step++;
      },
      complete: () => {
        expect(signerContext).toHaveBeenCalled();
        expect(sign).toHaveBeenCalledWith(expect.any(String), expect.any(Buffer), 1);
        expect(createUnsignedSendTransaction).toHaveBeenCalledWith(transaction, account.xpub);
        done();
      },
      error: err => done(err),
    });
  });

  it("should sign a 'list_neurons' transaction", done => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "list_neurons",
      amount: new BigNumber(0),
      recipient: "test-recipient",
      fees: new BigNumber("10000"),
    };
    const unsignedTx: UnsignedTransaction = {
      request_type: SubmitRequestType.Call,
      canister_id: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"), // some dummy values
      method_name: "list_neurons",
      arg: Buffer.from(""),
      sender: Principal.fromText("aaaaa-aa"),
      ingress_expiry: new Expiry(0),
    };
    (createUnsignedListNeuronsTransaction as jest.Mock).mockReturnValue({
      unsignedTransaction: unsignedTx,
    });
    (createReadStateRequest as jest.Mock).mockResolvedValue({
      requestId: Buffer.from("mock-request-id"),
      readStateBody: {
        content: {},
      },
    });

    const signOperation = buildSignOperation(signerContext);

    const observable = signOperation({ account, transaction, deviceId });

    let step = 0;
    observable.subscribe({
      next: (event: any) => {
        switch (step) {
          case 0:
            expect(event.type).toBe("device-signature-requested");
            break;
          case 1:
            expect(event.type).toBe("device-signature-granted");
            break;
          case 2:
            expect(event.type).toBe("signed");
            expect(event.signedOperation.signature).toBe(
              Buffer.from("mock-request-signature-rs").toString("hex"),
            );
            expect(event.signedOperation.rawData.methodName).toBe("list_neurons");
            expect(event.signedOperation.rawData.requestId).toBe(
              Buffer.from("mock-request-id").toString("hex"),
            );
            expect(event.signedOperation.operation.id).toBe("op-id-");
            break;
        }
        step++;
      },
      complete: () => {
        expect(signerContext).toHaveBeenCalled();
        expect(signUpdateCall).toHaveBeenCalled();
        expect(createUnsignedListNeuronsTransaction).toHaveBeenCalledWith(account.xpub);
        done();
      },
      error: err => done(err),
    });
  });

  it("should sign a 'set_dissolve_delay' transaction", done => {
    const transaction: Transaction = {
      family: "internet_computer",
      type: "set_dissolve_delay",
      amount: new BigNumber(0),
      recipient: "test-recipient",
      neuronId: "12345",
      fees: new BigNumber("10000"),
    };
    const unsignedTx: UnsignedTransaction = {
      request_type: SubmitRequestType.Call,
      canister_id: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"), // some dummy values
      method_name: "manage_neuron",
      arg: Buffer.from(""),
      sender: Principal.fromText("aaaaa-aa"),
      ingress_expiry: new Expiry(0),
    };
    (createUnsignedNeuronCommandTransaction as jest.Mock).mockReturnValue({
      unsignedTransaction: unsignedTx,
    });
    (createReadStateRequest as jest.Mock).mockResolvedValue({
      requestId: Buffer.from("mock-request-id"),
      readStateBody: {
        content: {},
      },
    });

    const signOperation = buildSignOperation(signerContext);

    const observable = signOperation({ account, transaction, deviceId });

    let step = 0;
    observable.subscribe({
      next: (event: any) => {
        switch (step) {
          case 0:
            expect(event.type).toBe("device-signature-requested");
            break;
          case 1:
            expect(event.type).toBe("device-signature-granted");
            break;
          case 2:
            expect(event.type).toBe("signed");
            expect(event.signedOperation.signature).toBe(
              Buffer.from("mock-request-signature-rs").toString("hex"),
            );
            expect(event.signedOperation.rawData.methodName).toBe("set_dissolve_delay");
            expect(event.signedOperation.rawData.requestId).toBe(
              Buffer.from("mock-request-id").toString("hex"),
            );
            expect(event.signedOperation.rawData.neuronId).toBe("12345");
            expect(event.signedOperation.operation.id).toBe("op-id-");
            break;
        }
        step++;
      },
      complete: () => {
        expect(signerContext).toHaveBeenCalled();
        expect(signUpdateCall).toHaveBeenCalled();
        expect(createUnsignedNeuronCommandTransaction).toHaveBeenCalledWith(
          transaction,
          account.xpub,
        );
        done();
      },
      error: err => done(err),
    });
  });

  // More tests here
});

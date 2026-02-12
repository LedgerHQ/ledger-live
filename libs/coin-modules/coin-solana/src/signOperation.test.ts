import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { DeviceModelId } from "@ledgerhq/devices";
import { Account, Operation, OperationType, SignOperationEvent } from "@ledgerhq/types-live";
import { BlockhashWithExpiryBlockHeight, VersionedTransaction } from "@solana/web3.js";
import { ChainAPI } from "./network";
import { buildSignOperation } from "./signOperation";
import { SolanaAddress } from "./signer";
import { Transaction } from "./types";

const TRANSFER_KINDS = [
  "transfer",
  "token.transfer",
  "token.createATA",
  "stake.createAccount",
  "stake.delegate",
  "stake.undelegate",
  "stake.withdraw",
  "stake.split",
];

jest.mock("./buildTransaction", () => {
  return {
    buildTransactionWithAPI: (_address: string, _transaction: Transaction, _api: ChainAPI) =>
      Promise.resolve([
        versionedTransaction(),
        blockhashWithExpiryBlockHeight(),
        (_signature: Buffer) => versionedTransaction(1),
      ]),
  };
});

describe("Testing signOperation", () => {
  describe("Testing buildSignOperation", () => {
    it.each(TRANSFER_KINDS)("should correctly sign user transaction of kind %s", (kind, done) => {
      const validationByEventType = new Map<
        string,
        (value: SignOperationEvent, kind?: string) => boolean
      >();
      validationByEventType.set("device-signature-requested", isValidDeviceSignatureRequestedEvent);
      validationByEventType.set("device-signature-granted", isValidDeviceSignatureGrantedEvent);
      validationByEventType.set("signed", isValidSignedEvent);

      const observable = buildSignOperation(
        signContext(),
        api(),
      )({
        account: account(),
        deviceId: "any random value",
        deviceModelId: DeviceModelId.blue,
        transaction: transaction(kind),
      });

      let index = 0;
      const expectedEventTypeOrder = [
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ];
      observable.subscribe(data => {
        expect(data.type).toEqual(expectedEventTypeOrder[index]);

        const validateFunction = validationByEventType.get(data.type);
        expect(validateFunction).toBeInstanceOf(Function);
        expect(validateFunction!(data, kind)).toEqual(true);

        index++;
        if (index >= expectedEventTypeOrder.length) {
          done();
        }
      });
    });
  });
});

function isValidSignedEvent(event: SignOperationEvent, kind?: string): boolean {
  if (event.type === "signed" && kind) {
    const signedOperation = event.signedOperation;
    return (
      signedOperation.operation.type === toOperationType(kind) &&
      signedOperation.signature !== undefined &&
      signedOperation.rawData !== undefined
    );
  }
  return false;
}

function isValidDeviceSignatureGrantedEvent(event: SignOperationEvent, _kind?: string): boolean {
  const keys = Object.keys(event);
  return keys.length === 1 && keys[0] === "type";
}

function isValidDeviceSignatureRequestedEvent(event: SignOperationEvent, _kind?: string): boolean {
  const keys = Object.keys(event);
  return keys.length === 1 && keys[0] === "type";
}

function signContext<SolanaSigner>(): SignerContext<SolanaSigner> {
  return <T>(_deviceId: string, _fn: (signer: SolanaSigner) => Promise<T>) => {
    return _fn({
      getAddress: (_path: string, _display?: boolean) => Promise.resolve({} as SolanaAddress),
      signTransaction: (_deviceId: string, _tx: Buffer) =>
        Promise.resolve({ signature: Buffer.from("") }),
    } as SolanaSigner);
  };
}

function versionedTransaction(size: number = 0) {
  return {
    serialize: () => (size <= 0 ? new Uint8Array() : new Uint8Array(size)),
    message: {
      serialize: () => (size <= 0 ? new Uint8Array() : new Uint8Array(size)),
    },
  } as VersionedTransaction;
}

function blockhashWithExpiryBlockHeight() {
  return {} as BlockhashWithExpiryBlockHeight;
}

function api() {
  return {} as ChainAPI;
}

function account(): Account {
  return {
    id: "0",
    freshAddress: "44",
    freshAddressPath: "44'/501'/0'",
    operations: [] as Operation[],
    pendingOperations: [] as Operation[],
  } as Account;
}

function transaction(kind: string): Transaction {
  return {
    recipient: "any random value",
    model: {
      commandDescriptor: {
        command: {
          kind: kind,
          recipientDescriptor: { shouldCreateAsAssociatedTokenAccount: false }, // needed only for "token.transfer" kind
          amount: 100,
        },
        errors: {},
      },
    },
    subAccountId: "any random value", // needed only for "token.transfer" kind
  } as Transaction;
}

const OPERATION_TYPE_BY_KIND: Record<string, OperationType> = {
  "stake.createAccount": "DELEGATE",
  "stake.delegate": "DELEGATE",
  "stake.split": "OUT",
  "stake.undelegate": "UNDELEGATE",
  "stake.withdraw": "IN",
  "token.createATA": "OPT_IN",
  "token.transfer": "FEES",
  transfer: "OUT",
};

export function toOperationType(kind: string): OperationType {
  const operationType = OPERATION_TYPE_BY_KIND[kind];
  if (operationType) {
    return operationType;
  }

  throw new Error(`${kind} is not supported by OperationType`);
}

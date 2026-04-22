/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DeviceModelId } from "@ledgerhq/devices";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { Account, Operation, OperationType, SignOperationEvent } from "@ledgerhq/types-live";
import { BlockhashWithExpiryBlockHeight, VersionedTransaction } from "@solana/web3.js";
import { buildVersionedTransaction } from "./logic/craftTransaction";
import { ChainAPI } from "./network";
import { buildSignOperation } from "./signOperation";
import { SolanaAddress, SolanaSigner } from "./signer";
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

const TEST_BLOCKHASH = "DJRuRgQP3BeBNH8WVdF9cppBDj7pQNiVr4ZDnqupRtTC";

jest.mock("./logic/craftTransaction", () => ({
  buildVersionedTransaction: jest.fn(),
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn((key: string) => (key === "API_SOLANA_PROXY" ? "https://example.test" : "")),
}));

const mockBuildVersionedTransaction = jest.mocked(buildVersionedTransaction);

function versionedTransaction(size: number = 0, signatures: readonly Buffer[] = []) {
  return {
    serialize: () => (size <= 0 ? new Uint8Array() : new Uint8Array(size)),
    message: {
      serialize: () => (size <= 0 ? new Uint8Array() : new Uint8Array(size)),
    },
    signatures,
  } as unknown as VersionedTransaction;
}

function blockhashWithExpiryBlockHeight(): BlockhashWithExpiryBlockHeight {
  return {
    blockhash: TEST_BLOCKHASH,
    lastValidBlockHeight: 1,
  };
}

function defaultBuildTuple(signatures: readonly Buffer[] = []) {
  return [
    versionedTransaction(0, signatures),
    blockhashWithExpiryBlockHeight(),
    (_signature: Buffer, _recentBlockhash?: BlockhashWithExpiryBlockHeight) =>
      versionedTransaction(1, signatures),
  ] as const;
}

function api(): ChainAPI {
  return {
    config: { endpoint: "https://example.test" },
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 123,
    }),
  } as unknown as ChainAPI;
}

function createSignContext() {
  const signTransaction = jest.fn((_deviceId: string, _tx: Buffer, _resolution?: unknown) =>
    Promise.resolve({ signature: Buffer.from("") }),
  );

  const context: SignerContext<SolanaSigner> = <T>(
    _deviceId: string,
    fn: (signer: SolanaSigner) => Promise<T>,
  ) =>
    fn({
      getAddress: (_path: string, _display?: boolean) => Promise.resolve({} as SolanaAddress),
      signTransaction,
    } as unknown as SolanaSigner);

  return { context, signTransaction };
}

function account(): Account {
  return {
    id: "0",
    freshAddress: "44",
    freshAddressPath: "44'/501'/0'",
    operations: [] as Operation[],
    pendingOperations: [] as Operation[],
    currency: { id: "solana" },
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

beforeEach(() => {
  jest.clearAllMocks();
  mockBuildVersionedTransaction.mockImplementation(() =>
    Promise.resolve([...defaultBuildTuple([])]),
  );
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

      const { context } = createSignContext();

      const observable = buildSignOperation(
        context,
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
        if (index === expectedEventTypeOrder.length) {
          done();
        }
      });
    });
  });

  describe("buildSignOperation – hasRealSignatures", () => {
    it("passes delayed and fetchBlockhash when signatures array is empty", done => {
      const { context, signTransaction } = createSignContext();
      const testApi = api();

      mockBuildVersionedTransaction.mockResolvedValueOnce([...defaultBuildTuple([])]);

      buildSignOperation(
        context,
        testApi,
      )({
        account: account(),
        deviceId: "d1",
        deviceModelId: DeviceModelId.blue,
        transaction: transaction("transfer"),
      }).subscribe({
        complete: () => {
          expect(signTransaction).toHaveBeenCalledTimes(1);
          const resolution = signTransaction.mock.calls[0][2] as {
            delayed?: boolean;
            fetchBlockhash?: () => Promise<Uint8Array>;
            solanaRPCURL?: string;
          };
          expect(resolution.solanaRPCURL).toEqual("https://example.test");
          expect(resolution.delayed).toEqual(true);
          expect(typeof resolution.fetchBlockhash).toEqual("function");
          expect(jest.mocked(testApi.getLatestBlockhash)).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it("calls getLatestBlockhash with confirmed when fetchBlockhash runs (empty signatures)", async () => {
      const { context, signTransaction } = createSignContext();
      const testApi = api();

      mockBuildVersionedTransaction.mockResolvedValueOnce([...defaultBuildTuple([])]);

      signTransaction.mockImplementation(async (_path, _tx, resolution) => {
        const r = resolution as { fetchBlockhash?: () => Promise<Uint8Array> };
        if (r.fetchBlockhash) {
          await r.fetchBlockhash();
        }
        return { signature: Buffer.from("aa") };
      });

      await new Promise<void>((resolve, reject) => {
        buildSignOperation(
          context,
          testApi,
        )({
          account: account(),
          deviceId: "d1",
          deviceModelId: DeviceModelId.blue,
          transaction: transaction("transfer"),
        }).subscribe({
          complete: () => resolve(),
          error: reject,
        });
      });

      expect(jest.mocked(testApi.getLatestBlockhash)).toHaveBeenCalledWith("confirmed");
    });

    it("passes delayed and fetchBlockhash when all signatures are dummy placeholders", done => {
      const { context, signTransaction } = createSignContext();
      const allZeroDummy = Buffer.alloc(64, 0);
      mockBuildVersionedTransaction.mockResolvedValueOnce([...defaultBuildTuple([allZeroDummy])]);

      buildSignOperation(
        context,
        api(),
      )({
        account: account(),
        deviceId: "d1",
        deviceModelId: DeviceModelId.blue,
        transaction: transaction("transfer"),
      }).subscribe({
        complete: () => {
          const resolution = signTransaction.mock.calls[0][2] as {
            delayed?: boolean;
            fetchBlockhash?: () => Promise<unknown>;
          };
          expect(resolution.delayed).toBe(true);
          expect(typeof resolution.fetchBlockhash).toBe("function");
          done();
        },
      });
    });

    it("omits delayed and fetchBlockhash when a non-dummy signature is present", done => {
      const { context, signTransaction } = createSignContext();
      const testApi = api();
      const realSig = Buffer.alloc(64, 2);

      mockBuildVersionedTransaction.mockResolvedValueOnce([...defaultBuildTuple([realSig])]);

      buildSignOperation(
        context,
        testApi,
      )({
        account: account(),
        deviceId: "d1",
        deviceModelId: DeviceModelId.blue,
        transaction: transaction("transfer"),
      }).subscribe({
        complete: () => {
          const resolution = signTransaction.mock.calls[0][2] as {
            delayed?: boolean;
            fetchBlockhash?: () => Promise<unknown>;
            solanaRPCURL?: string;
          };
          expect(resolution.solanaRPCURL).toBe("https://example.test");
          expect(resolution.delayed).toBeUndefined();
          expect(resolution.fetchBlockhash).toBeUndefined();
          expect(jest.mocked(testApi.getLatestBlockhash)).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it("uses override recentBlockhash in rawData when fetchBlockhash runs before signing", async () => {
      const { context, signTransaction } = createSignContext();
      const testApi = api();
      const fresh: BlockhashWithExpiryBlockHeight = {
        blockhash: TEST_BLOCKHASH,
        lastValidBlockHeight: 999,
      };
      jest.mocked(testApi.getLatestBlockhash).mockResolvedValue(fresh);

      const signOnChainSpy = jest.fn(
        (_signature: Buffer, _recentBlockhash?: BlockhashWithExpiryBlockHeight) =>
          versionedTransaction(1, []),
      );

      mockBuildVersionedTransaction.mockResolvedValueOnce([
        versionedTransaction(0, []),
        blockhashWithExpiryBlockHeight(),
        signOnChainSpy,
      ]);

      signTransaction.mockImplementation(async (_path, _tx, resolution) => {
        const r = resolution as { fetchBlockhash?: () => Promise<Uint8Array> };
        if (r.fetchBlockhash) {
          await r.fetchBlockhash();
        }
        return { signature: Buffer.from("bb") };
      });

      let signedEvent: SignOperationEvent | undefined;

      await new Promise<void>((resolve, reject) => {
        buildSignOperation(
          context,
          testApi,
        )({
          account: account(),
          deviceId: "d1",
          deviceModelId: DeviceModelId.blue,
          transaction: transaction("transfer"),
        }).subscribe({
          next: e => {
            if (e.type === "signed") {
              signedEvent = e;
            }
          },
          complete: () => resolve(),
          error: reject,
        });
      });

      expect(signOnChainSpy).toHaveBeenCalledWith(Buffer.from("bb"), fresh);
      expect(signedEvent?.type).toBe("signed");
      if (signedEvent?.type === "signed") {
        expect(signedEvent.signedOperation.rawData?.recentBlockhash).toEqual(fresh);
      }
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

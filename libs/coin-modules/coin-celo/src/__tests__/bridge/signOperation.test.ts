import { FeeNotLoaded } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { accountFixture, transactionFixture } from "../../bridge/fixtures";
import { buildSignOperation } from "../../bridge/signOperation";
import buildTransaction from "../../bridge/buildTransaction";
import { buildOptimisticOperation } from "../../bridge/buildOptimisticOperation";
import { getFeeMarketGasParams } from "../../network/sdk";
import { recoverAddress } from "viem";
import { serializeTransaction } from "viem/celo";

jest.mock("../../bridge/buildTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../bridge/buildOptimisticOperation", () => ({
  __esModule: true,
  buildOptimisticOperation: jest.fn(),
}));

jest.mock("../../network/sdk", () => ({
  getFeeMarketGasParams: jest.fn(),
}));

jest.mock("viem", () => {
  const actual = jest.requireActual("viem");
  return {
    ...actual,
    recoverAddress: jest.fn(),
  };
});

jest.mock("viem/celo", () => {
  const actual = jest.requireActual("viem/celo");
  return {
    ...actual,
    serializeTransaction: jest.fn(actual.serializeTransaction),
  };
});

const mockBuildTransaction = buildTransaction as jest.MockedFunction<typeof buildTransaction>;
const mockBuildOptimisticOperation = buildOptimisticOperation as jest.MockedFunction<
  typeof buildOptimisticOperation
>;
const mockGetFeeMarketGasParams = getFeeMarketGasParams as jest.MockedFunction<
  typeof getFeeMarketGasParams
>;
const mockRecoverAddress = recoverAddress as jest.MockedFunction<typeof recoverAddress>;
const mockSerializeTransaction = serializeTransaction as jest.MockedFunction<typeof serializeTransaction>;

const BASE_UNSIGNED_TRANSACTION = {
  from: "0x1111111111111111111111111111111111111111" as `0x${string}`,
  to: "0x2222222222222222222222222222222222222222" as `0x${string}`,
  value: "0x1" as `0x${string}`,
  gas: "21000",
  chainId: 42220,
  nonce: 7,
  data: "0x" as `0x${string}`,
};

const LEDGER_SIGNATURE = {
  v: "1b",
  r: "5a19df5f2515a421f0f6abf9ecf15a0d07f9c30f4bbf008f087f68e3a035f36c",
  s: "47f3c72f6f95fcd901f8fd84d146f318844f82f65dd4adf6bb4ef3a260f7026c",
};

const createSignerContext = ({
  address = "0x1111111111111111111111111111111111111111",
  signTransactionResult = LEDGER_SIGNATURE,
}: {
  address?: string;
  signTransactionResult?: Promise<unknown> | unknown;
}) => {
  const getAddress = jest.fn(async () => ({ address }));
  const signTransaction = jest.fn(async () => signTransactionResult);

  const signerContext = jest.fn(async (_deviceId: string, cb: (signer: unknown) => unknown) =>
    cb({ getAddress, signTransaction }),
  );

  return { signerContext, getAddress, signTransaction };
};

const collectEvents = async (
  signerContext: ReturnType<typeof createSignerContext>["signerContext"],
  transactionOverrides: Partial<typeof transactionFixture> = {},
) => {
  const events: SignOperationEvent[] = [];
  const operation = buildSignOperation(signerContext as never);

  await new Promise<void>((resolve, reject) => {
    operation({
      account: accountFixture,
      transaction: {
        ...transactionFixture,
        recipient: "0x3333333333333333333333333333333333333333",
        fees: new BigNumber(2),
        ...transactionOverrides,
      },
      deviceId: "device-id",
    }).subscribe({
      next: event => events.push(event),
      error: reject,
      complete: resolve,
    });
  });

  return events;
};

describe("signOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildTransaction.mockResolvedValue(BASE_UNSIGNED_TRANSACTION as never);
    mockGetFeeMarketGasParams.mockResolvedValue({
      maxFeePerGas: BigInt(2),
      maxPriorityFeePerGas: BigInt(1),
    });
    mockRecoverAddress.mockResolvedValue(
      "0x1111111111111111111111111111111111111111" as `0x${string}`,
    );
    mockBuildOptimisticOperation.mockReturnValue({
      id: "op-id",
    } as never);
  });

  it("emits request, granted and signed events for eip1559 transactions", async () => {
    const { signerContext } = createSignerContext({});
    const events = await collectEvents(signerContext);

    expect(events.map(event => event.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
    expect(mockGetFeeMarketGasParams).toHaveBeenCalledWith(undefined);
    const signedEvent = events[2];
    expect(signedEvent.type).toBe("signed");
    if (signedEvent.type !== "signed") {
      throw new Error("expected signed event");
    }
    expect(typeof signedEvent.signedOperation.signature).toBe("string");
    expect(signedEvent.signedOperation.signature.startsWith("0x")).toBe(true);
  });

  it("builds a cip64 transaction when feeCurrency is set", async () => {
    const { signerContext } = createSignerContext({});
    mockBuildTransaction.mockResolvedValue({
      ...BASE_UNSIGNED_TRANSACTION,
      feeCurrency: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    } as never);

    await collectEvents(signerContext, {
      feeCurrency: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
    });

    expect(mockSerializeTransaction).toHaveBeenCalled();
    const hasCip64Call = mockSerializeTransaction.mock.calls.some(
      call => call[0] && typeof call[0] === "object" && (call[0] as { type?: string }).type === "cip64",
    );
    expect(hasCip64Call).toBe(true);
  });

  it("throws FeeNotLoaded when transaction fees are missing", async () => {
    const { signerContext } = createSignerContext({});
    const operation = buildSignOperation(signerContext as never);

    await expect(
      new Promise<void>((resolve, reject) => {
        operation({
          account: accountFixture,
          transaction: {
            ...transactionFixture,
            recipient: "0x3333333333333333333333333333333333333333",
            fees: null,
          },
          deviceId: "device-id",
        }).subscribe({
          next: () => resolve(),
          complete: () => resolve(),
          error: reject,
        });
      }),
    ).rejects.toBeInstanceOf(FeeNotLoaded);
  });

  it("throws when recovered address does not match device address", async () => {
    mockRecoverAddress.mockResolvedValue(
      "0x9999999999999999999999999999999999999999" as `0x${string}`,
    );
    const { signerContext } = createSignerContext({});

    await expect(collectEvents(signerContext)).rejects.toThrow(
      "celo: there was a signing error, the recovered address doesn't match your ledger address, the operation was cancelled",
    );
  });

  it("does not emit granted/signed after unsubscribe during signing", async () => {
    let resolveSignature: (value: unknown) => void;
    const signaturePromise = new Promise(resolve => {
      resolveSignature = resolve;
    });
    const { signerContext } = createSignerContext({
      signTransactionResult: signaturePromise,
    });

    const operation = buildSignOperation(signerContext as never);
    const events: SignOperationEvent[] = [];

    const subscription = operation({
      account: accountFixture,
      transaction: {
        ...transactionFixture,
        recipient: "0x3333333333333333333333333333333333333333",
        fees: new BigNumber(2),
      },
      deviceId: "device-id",
    }).subscribe({
      next: event => events.push(event),
      error: () => undefined,
      complete: () => undefined,
    });

    await Promise.resolve();
    subscription.unsubscribe();
    resolveSignature!(LEDGER_SIGNATURE);
    await Promise.resolve();

    expect(events.find(event => event.type === "device-signature-granted")).toBeUndefined();
    expect(events.find(event => event.type === "signed")).toBeUndefined();
  });
});

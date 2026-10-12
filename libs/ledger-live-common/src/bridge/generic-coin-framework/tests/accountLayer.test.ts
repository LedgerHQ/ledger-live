import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import type { AccountLayer } from "@ledgerhq/ledger-wallet-framework/api/types";
import { completeIntent } from "../accountLayer";
import { genericGetAccountShape } from "../getAccountShape";
import { genericPrepareTransaction } from "../prepareTransaction";
import { genericGetTransactionStatus } from "../getTransactionStatus";
import { genericEstimateMaxSpendable } from "../estimateMaxSpendable";
import { genericSignOperation } from "../signOperation";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";
import type { CoinFrameworkSigner } from "../types";

jest.mock("../api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("../bridge", () => ({ getBridgeApi: jest.fn() }));

const currency = {
  id: "bitcoin",
  family: "bitcoin",
  name: "Bitcoin",
  units: [{ name: "bitcoin", code: "BTC", magnitude: 8 }],
};
const account = {
  type: "Account",
  id: "js:2:bitcoin:xpub:native_segwit",
  currency,
  freshAddress: "bc1qfresh",
  freshAddressPath: "84'/0'/0'/0/3",
  derivationMode: "native_segwit",
  balance: new BigNumber(100_000),
  spendableBalance: new BigNumber(100_000),
  pendingOperations: [],
  operations: [],
  subAccounts: [],
} as unknown as Account;

const transaction = {
  family: "bitcoin",
  amount: new BigNumber(50_000),
  recipient: "bc1qrecipient",
  fees: new BigNumber(1_000),
  nonce: new BigNumber(0),
  familySpecificData: { utxoStrategy: { strategy: 0, excludeUTXOs: [] } },
} as any;

const completed = { completed: true };

function layer(overrides: Partial<AccountLayer> = {}): AccountLayer {
  return {
    getAccountShape: jest.fn(async () => ({ id: "shape" })),
    completeIntent: jest.fn(async intent => ({ ...intent, data: completed })),
    postSync: jest.fn((_, synced) => synced),
    ...overrides,
  };
}

const api = {
  craftTransactionData: () => ({ type: "none" }),
  estimateFees: jest.fn(async () => ({ value: 1_000n, parameters: { amount: 49_000n } })),
  validateIntent: jest.fn(async () => ({
    errors: {},
    warnings: {},
    estimatedFees: 1_000n,
    amount: 50_000n,
    totalSpent: 51_000n,
  })),
  craftTransaction: jest.fn(async () => ({ transaction: "envelope", details: { fee: 1_000n } })),
  combine: jest.fn(async () => "signed-hex"),
  getNextSequence: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getCoinModuleApi as jest.Mock).mockResolvedValue(api);
});

describe("completeIntent", () => {
  const intent = { recipient: "r" } as any;

  it("returns the intent as is without an account layer", async () => {
    expect(await completeIntent({}, intent, account, transaction, api as any, {} as any)).toBe(intent);
  });

  it("hands the intent, a copy of the transaction and the coin module to the account layer", async () => {
    const accountLayer = layer();
    const context = { config: jest.fn(), logger: jest.fn() };
    const result = await completeIntent({ accountLayer }, intent, account, transaction, api as any, context);
    expect(result).toEqual({ recipient: "r", data: completed });
    const [, , txArg, deps] = (accountLayer.completeIntent as jest.Mock).mock.calls[0];
    expect(txArg).toEqual(transaction);
    expect(txArg).not.toBe(transaction);
    expect(deps).toEqual({ api, context });
  });
});

describe("genericGetAccountShape with an account layer", () => {
  const info = {
    currency,
    address: "bc1qfresh",
    index: 0,
    derivationPath: "84'/0'",
    derivationMode: "native_segwit",
    deviceId: "device",
  } as any;
  const signer: CoinFrameworkSigner = {
    getAddress: jest.fn(),
    context: jest.fn(),
  };

  it("delegates the whole shape to the family", async () => {
    const accountLayer = layer();
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountLayer });
    const shape = await genericGetAccountShape("bitcoin", "local", signer)(info, {
      paginationConfig: {},
    });
    expect(shape).toEqual({ id: "shape" });
    expect(accountLayer.getAccountShape).toHaveBeenCalledWith(
      info,
      { paginationConfig: {} },
      expect.objectContaining({ api, signerContext: signer.context }),
    );
  });

  it("needs a signer", async () => {
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountLayer: layer() });
    await expect(
      genericGetAccountShape("bitcoin", "local")(info, { paginationConfig: {} }),
    ).rejects.toThrow("No signer to sync a bitcoin account");
  });
});

describe("transaction flows with an account layer", () => {
  beforeEach(() => (getBridgeApi as jest.Mock).mockResolvedValue({ accountLayer: layer() }));

  it("prepares the completed intent", async () => {
    await genericPrepareTransaction("bitcoin", "local")(account, transaction);
    expect(api.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: completed }),
      expect.anything(),
    );
  });

  it("validates the completed intent", async () => {
    await genericGetTransactionStatus("bitcoin", "local")(account, transaction);
    expect(api.validateIntent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: completed }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("estimates the send-max of the completed intent", async () => {
    const max = await genericEstimateMaxSpendable("bitcoin", "local")({ account, transaction });
    expect(max.toNumber()).toBe(49_000);
    expect(api.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: completed }),
    );
  });
});

describe("genericSignOperation with an account layer", () => {
  const signer = {
    getAddress: jest.fn(async () => ({ publicKey: "pub" })),
    signTransaction: jest.fn(async (_path, _unsigned, options) => {
      options.onDeviceStreaming({ progress: 0.5, index: 0, total: 2 });
      options.onDeviceSignatureRequested();
      options.onDeviceSignatureGranted();
      return "device-signed";
    }),
  };
  const signerContext = jest.fn(async (_deviceId, fn) => fn(signer));

  it("lets the family signer report the device steps and decorates the optimistic operation", async () => {
    const decorateOptimisticOperation = jest.fn(operation => ({ ...operation, decorated: true }));
    (getBridgeApi as jest.Mock).mockResolvedValue({
      accountLayer: layer({ decorateOptimisticOperation }),
    });

    const events = await lastValueFrom(
      genericSignOperation("bitcoin", "local")(signerContext)({
        account,
        transaction,
        deviceId: "device",
      }).pipe(toArray()),
    );

    expect(events.map(e => e.type)).toEqual([
      "device-streaming",
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
    expect(events[0]).toEqual({ type: "device-streaming", progress: 0.5, index: 0, total: 2 });
    expect(api.craftTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: completed }),
      expect.anything(),
    );
    expect(decorateOptimisticOperation).toHaveBeenCalledWith(
      expect.any(Object),
      { transaction: "envelope", details: { fee: 1_000n } },
      account,
      transaction,
    );
    const signed = events[3] as { signedOperation: { operation: unknown; signature: string } };
    expect(signed.signedOperation.signature).toBe("signed-hex");
    expect(signed.signedOperation.operation).toMatchObject({ decorated: true });
  });

  it("keeps the generic optimistic operation when the family does not decorate it", async () => {
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountLayer: layer() });
    const events = await lastValueFrom(
      genericSignOperation("bitcoin", "local")(signerContext)({
        account,
        transaction,
        deviceId: "device",
      }).pipe(toArray()),
    );
    const signed = events[events.length - 1] as { signedOperation: { operation: { type: string } } };
    expect(signed.signedOperation.operation.type).toBe("OUT");
  });
});

import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import type { AccountModuleApi } from "@ledgerhq/account-module-framework";
import type { AccountModuleBinding } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account } from "@ledgerhq/types-live";
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
  index: 0,
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
  familySpecificData: { utxoStrategy: { strategy: 0, excludeUTXOs: [] } },
} as any;

const craftedOperation = {
  id: "",
  hash: "",
  type: "OUT",
  value: 51_000n,
  fee: 1_000n,
  asset: { type: "native" },
  senders: ["bc1qmine"],
  recipients: ["bc1qrecipient"],
  block: null,
  date: new Date(),
  failed: false,
  optimistic: true,
  details: { inputs: ["prev-0"] },
};

function fakeModule(): jest.Mocked<AccountModuleApi> {
  return {
    sync: jest.fn(async function* () {
      yield { state: { version: 1, data: {} }, progress: { blockHeight: 7 } };
    }),
    getBalances: jest.fn(async () => [{ value: 100_000n, asset: { type: "native" } }]),
    getFreshAddress: jest.fn(async () => ({ address: "bc1qnext", derivationPath: "84'/0'/0'/0/4" })),
    estimateFees: jest.fn(async () => ({ value: 1_000n, parameters: { amount: 49_000n } })),
    validateIntent: jest.fn(async () => ({
      errors: {},
      warnings: {},
      estimatedFees: 1_000n,
      amount: 50_000n,
      totalSpent: 51_000n,
    })),
    craftTransaction: jest.fn(async () => ({
      transaction: "envelope",
      details: { fee: 1_000n },
      operation: craftedOperation,
    })),
    combine: jest.fn(async () => "signed-hex"),
  } as unknown as jest.Mocked<AccountModuleApi>;
}

const api = {
  craftTransactionData: () => ({ type: "none" }),
  estimateFees: jest.fn(),
  validateIntent: jest.fn(),
  craftTransaction: jest.fn(),
  combine: jest.fn(),
  getNextSequence: jest.fn(),
};

let accountModule: jest.Mocked<AccountModuleApi>;
const binding = (fields: Partial<AccountModuleBinding> = {}): AccountModuleBinding => ({
  create: () => accountModule,
  getAccountKey: jest.fn(async () => "xpub"),
  readState: () => undefined,
  accountFields: async () => ({}),
  ...fields,
});

beforeEach(() => {
  jest.clearAllMocks();
  accountModule = fakeModule();
  (getCoinModuleApi as jest.Mock).mockResolvedValue(api);
});

describe("genericGetAccountShape with an account module", () => {
  const info = {
    currency,
    address: "bc1qfresh",
    index: 0,
    derivationPath: "84'/0'",
    derivationMode: "native_segwit",
    deviceId: "device",
  } as any;
  const signer: CoinFrameworkSigner = { getAddress: jest.fn(), context: jest.fn() };

  it("lets the account module sync the whole account", async () => {
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountModule: binding() });
    const shape = await genericGetAccountShape("bitcoin", "local", signer)(info, {
      paginationConfig: {},
    });
    expect(shape).toMatchObject({
      id: "js:2:bitcoin:xpub:native_segwit",
      freshAddress: "bc1qnext",
      blockHeight: 7,
    });
    expect(accountModule.sync).toHaveBeenCalled();
  });

  it("needs a signer", async () => {
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountModule: binding() });
    await expect(
      genericGetAccountShape("bitcoin", "local")(info, { paginationConfig: {} }),
    ).rejects.toThrow("No signer to sync a bitcoin account");
  });
});

describe("transaction flows with an account module", () => {
  beforeEach(() => (getBridgeApi as jest.Mock).mockResolvedValue({ accountModule: binding() }));

  it("prepares through the account module, not the coin module", async () => {
    await genericPrepareTransaction("bitcoin", "local")(account, transaction);
    expect(accountModule.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ descriptor: expect.objectContaining({ key: "xpub" }) }),
      expect.objectContaining({ recipient: "bc1qrecipient" }),
      expect.anything(),
    );
    expect(api.estimateFees).not.toHaveBeenCalled();
  });

  it("validates through the account module", async () => {
    const status = await genericGetTransactionStatus("bitcoin", "local")(account, transaction);
    expect(status.totalSpent.toNumber()).toBe(51_000);
    expect(accountModule.validateIntent).toHaveBeenCalled();
    expect(api.validateIntent).not.toHaveBeenCalled();
  });

  it("estimates the send-max through the account module", async () => {
    const max = await genericEstimateMaxSpendable("bitcoin", "local")({ account, transaction });
    expect(max.toNumber()).toBe(49_000);
    expect(accountModule.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ useAllAmount: true }),
      undefined,
    );
  });
});

describe("genericSignOperation with an account module", () => {
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

  it("lets the family signer report the device steps and describes the operation crafted", async () => {
    const decorateOptimisticOperation = jest.fn(operation => ({ ...operation, decorated: true }));
    (getBridgeApi as jest.Mock).mockResolvedValue({
      accountModule: binding({ decorateOptimisticOperation }),
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
    expect(api.getNextSequence).not.toHaveBeenCalled();
    expect(accountModule.combine).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ transaction: "envelope" }),
      ["device-signed"],
      { pubkey: "pub" },
    );
    const signed = events[3] as { signedOperation: { operation: any; signature: string } };
    expect(signed.signedOperation.signature).toBe("signed-hex");
    expect(signed.signedOperation.operation).toMatchObject({
      decorated: true,
      fee: new BigNumber(1_000),
      value: new BigNumber(51_000),
      senders: ["bc1qmine"],
      extra: { inputs: ["prev-0"] },
    });
  });
});

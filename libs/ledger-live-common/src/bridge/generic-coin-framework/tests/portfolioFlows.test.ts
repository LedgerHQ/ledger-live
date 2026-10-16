import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { createSingleAddressAccountModule } from "@ledgerhq/account-module-single-address";
import { makeSync } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { getAccountRawAssignHooks } from "../accountRawAssign";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";
import { genericBroadcast } from "../broadcast";
import { genericEstimateMaxSpendable } from "../estimateMaxSpendable";
import { genericGetAccountShape } from "../getAccountShape";
import { genericPrepareTransaction } from "../prepareTransaction";
import { genericSignOperation } from "../signOperation";
import type { CoinFrameworkSigner, GenericTransaction } from "../types";
import {
  ADDRESS,
  ADDRESS_PATH,
  BITCOIN_ACCOUNT_ID,
  bitcoin,
  bitcoinAccount,
  CRAFTED_OPERATION,
  fakeAccountModule,
  fakeBinding,
  coinOperation,
  fakeCoinModule,
  listingFrom,
  mockLiveConfig,
  portfolioCoinConfig,
  ripple,
  RIPPLE_ACCOUNT_ID,
  rippleAccount,
  serviceStandIn,
  standInNetwork,
  XPUB,
  type FakeCoinModule,
  type SpiedPortfolio,
} from "./portfolioFixtures";

jest.mock("../api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("../accountRawAssign", () => ({ getAccountRawAssignHooks: jest.fn() }));
jest.mock("../bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));

type Mode = "local" | "hybrid" | "remote";

/** The coin configs of ripple and bitcoin: `undefined` keeps them on the legacy bridge. */
function configure(mode: Mode | undefined): void {
  mockLiveConfig({
    config_portfolio_service: { url: "https://portfolio.test", portfolioId: "wallet" },
    config_currency_ripple: mode ? portfolioCoinConfig(mode) : { status: { type: "active" } },
    config_currency_bitcoin: mode ? portfolioCoinConfig(mode) : { status: { type: "active" } },
  });
}

let coinModule: FakeCoinModule;
let serviceCoinModule: FakeCoinModule;
let service: SpiedPortfolio;

beforeEach(() => {
  jest.clearAllMocks();
  coinModule = fakeCoinModule();
  serviceCoinModule = fakeCoinModule({
    getBalance: jest.fn(async () => [{ value: 2_000n, asset: { type: "native" } }]),
    lastBlock: jest.fn(async () => ({ height: 130, hash: "h", time: new Date() })),
    estimateFees: jest.fn(async () => ({ value: 15n })),
    craftTransaction: jest.fn(async (_context, { sequence }) => ({
      transaction: `service-unsigned-${sequence}`,
    })),
    broadcast: jest.fn(async () => "service-hash"),
  });
  service = serviceStandIn(
    "xrp",
    standInNetwork(
      ripple,
      serviceCoinModule,
      createSingleAddressAccountModule(serviceCoinModule as never),
      "static",
    ),
  );
  (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);
  (getCoinModuleApi as jest.Mock).mockResolvedValue(coinModule);
  (getBridgeApi as jest.Mock).mockResolvedValue({});
  (getAccountRawAssignHooks as jest.Mock).mockResolvedValue({});
});

afterEach(() => jest.restoreAllMocks());

const signer: CoinFrameworkSigner = { getAddress: jest.fn(), context: jest.fn() };

const rippleInfo = {
  currency: ripple,
  address: ADDRESS,
  index: 0,
  derivationPath: ADDRESS_PATH,
  derivationMode: "",
} as never;
const bitcoinInfo = {
  currency: bitcoin,
  address: "bc1qfirst",
  index: 0,
  derivationPath: "84'/0'",
  derivationMode: "native_segwit",
  deviceId: "device",
} as never;

const xrpTransaction = (fields: Partial<GenericTransaction> = {}): GenericTransaction => ({
  family: "xrp",
  amount: new BigNumber(100),
  recipient: "rRecipient",
  fees: null,
  ...fields,
});

const rippleAccountWithFunds = (): Account =>
  rippleAccount({ balance: new BigNumber(1_000), spendableBalance: new BigNumber(1_000) });

describe("genericGetAccountShape", () => {
  it("syncs through the portfolio layer when the coin config enables it", async () => {
    configure("local");
    const module = fakeAccountModule();
    const binding = fakeBinding(module, { syncedHeight: jest.fn(() => 790) });
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountModule: binding });

    const shape = await genericGetAccountShape(
      "bitcoin",
      "local",
      signer,
    )(bitcoinInfo, {
      paginationConfig: {},
    });

    // The portfolio layer reads the height the module synced at from the state it stored.
    expect(shape).toMatchObject({ id: BITCOIN_ACCOUNT_ID, blockHeight: 790, xpub: XPUB });
    expect(binding.syncedHeight).toHaveBeenCalledWith({
      version: 1,
      data: { balance: "900", locked: "100" },
    });
    expect(coinModule.lastBlock).not.toHaveBeenCalled();
    await expect(
      genericGetAccountShape("bitcoin", "local")(bitcoinInfo, { paginationConfig: {} }),
    ).rejects.toThrow("No signer to scan bitcoin accounts");
  });

  it("keeps the legacy path otherwise", async () => {
    configure(undefined);
    const module = fakeAccountModule();
    const binding = fakeBinding(module, { syncedHeight: jest.fn(() => 790) });
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountModule: binding });

    const shape = await genericGetAccountShape(
      "bitcoin",
      "local",
      signer,
    )(bitcoinInfo, {
      paginationConfig: {},
    });

    expect(shape).toMatchObject({ id: BITCOIN_ACCOUNT_ID });
    // The legacy path takes the height the sync reported, none here.
    expect(shape).not.toHaveProperty("blockHeight");
    expect(binding.syncedHeight).not.toHaveBeenCalled();
    await expect(
      genericGetAccountShape("bitcoin", "local")(bitcoinInfo, { paginationConfig: {} }),
    ).rejects.toThrow("No signer to sync a bitcoin account");
  });

  it("adapts the operations of an address family with the family's own extra hooks", async () => {
    configure("local");
    const fromOperationExtraRaw = jest.fn(extra => ({ ...extra, revived: true }));
    (getAccountRawAssignHooks as jest.Mock).mockResolvedValue({ fromOperationExtraRaw });
    coinModule.listOperations.mockResolvedValue({
      items: [{ ...coinOperation(), details: { familyExtra: { kind: "xrp" } } }],
    });

    const shape = await genericGetAccountShape("ripple", "local")(rippleInfo, {
      paginationConfig: {},
    });

    expect(getAccountRawAssignHooks).toHaveBeenCalledWith("ripple");
    expect(shape.operations?.[0].extra).toEqual({ kind: "xrp", revived: true });
  });

  it("runs the chain rules of the family first", async () => {
    configure("local");
    const burnAddress = new Error("burn address");
    (getBridgeApi as jest.Mock).mockResolvedValue({
      getChainSpecificRules: {
        getAccountShape: jest.fn(() => {
          throw burnAddress;
        }),
      },
    });

    await expect(
      genericGetAccountShape("ripple", "local")(rippleInfo, { paginationConfig: {} }),
    ).rejects.toBe(burnAddress);
    expect(coinModule.lastBlock).not.toHaveBeenCalled();
  });

  it("reads the service in hybrid mode, syncing the hidden local twin", async () => {
    configure("hybrid");
    const shape = await genericGetAccountShape("ripple", "local")(rippleInfo, {
      paginationConfig: {},
    });

    expect(shape).toMatchObject({
      id: RIPPLE_ACCOUNT_ID,
      balance: new BigNumber(2_000),
      blockHeight: 130,
    });
    // As on the legacy path, jsHelpers keeps the account's own fresh address.
    expect(shape).not.toHaveProperty("freshAddress");
    expect(service.addRegistrations).toHaveBeenCalledTimes(1);
    expect(coinModule.lastBlock).toHaveBeenCalled();
  });

  it("keeps the family fields and stake amount of an operation over syncs that merge nothing (hedera)", async () => {
    configure("local");
    const listed = coinOperation({
      type: "DELEGATE",
      details: {
        familyExtra: { consensusTimestamp: "123.456" },
        stake: { address: "stake-account", amount: 777n },
      },
    });
    const listOperations = listingFrom(listed);
    (getCoinModuleApi as jest.Mock).mockResolvedValue(fakeCoinModule({ listOperations }));
    const sync = makeSync({
      getAccountShape: genericGetAccountShape("ripple", "local"),
      shouldMergeOps: false,
    });

    let account = rippleAccount();
    const extras: unknown[] = [];
    for (let round = 0; round < 3; round++) {
      const updaters = await lastValueFrom(sync(account, { paginationConfig: {} }).pipe(toArray()));
      account = updaters.reduce((synced, updater) => updater(synced), account);
      extras.push(account.operations.map(({ extra }) => extra));
    }

    const extra = {
      consensusTimestamp: "123.456",
      stake: { address: "stake-account", amount: new BigNumber(777) },
    };
    expect(extras).toEqual([[extra], [extra], [extra]]);
    expect(listOperations.mock.calls.map(([, , { minHeight }]) => minHeight)).toEqual([
      0, 111, 111,
    ]);
  });
});

describe("genericPrepareTransaction", () => {
  it("estimates the fees through the side writing for the chain when enabled", async () => {
    configure("remote");
    const prepared = await genericPrepareTransaction("ripple", "local")(
      rippleAccountWithFunds(),
      xrpTransaction(),
    );
    expect(prepared.fees).toEqual(new BigNumber(15));
    expect(serviceCoinModule.estimateFees).toHaveBeenCalled();
    expect(coinModule.estimateFees).not.toHaveBeenCalled();
  });

  it("estimates them with the coin module otherwise", async () => {
    configure(undefined);
    const prepared = await genericPrepareTransaction("ripple", "local")(
      rippleAccountWithFunds(),
      xrpTransaction(),
    );
    expect(prepared.fees).toEqual(new BigNumber(12));
    expect(coinModule.estimateFees).toHaveBeenCalled();
    expect(createPortfolioServiceClient).not.toHaveBeenCalled();
  });
});

describe("genericEstimateMaxSpendable", () => {
  it.each([
    // The service estimates 15 with no reserve.
    ["through the portfolio when enabled", "remote" as const, 985],
    // The coin module estimates 12 with a reserve of 10.
    ["with the coin module otherwise", undefined, 988],
  ])("estimates %s", async (_name, mode, max) => {
    configure(mode);
    const spendable = await genericEstimateMaxSpendable(
      "ripple",
      "local",
    )({
      account: rippleAccountWithFunds(),
      transaction: xrpTransaction(),
    });
    expect(spendable).toEqual(new BigNumber(max));
  });

  it("goes through the account module of the local side for an account module family", async () => {
    configure("local");
    const module = fakeAccountModule();
    (getBridgeApi as jest.Mock).mockResolvedValue({ accountModule: fakeBinding(module) });

    const spendable = await genericEstimateMaxSpendable(
      "bitcoin",
      "local",
    )({
      account: bitcoinAccount({ spendableBalance: new BigNumber(100_000) }),
      transaction: undefined,
    });

    // The account module's send-max amount, JSON safe once through the portfolio.
    expect(spendable).toEqual(new BigNumber(49_000));
    expect(module.estimateFees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ descriptor: expect.objectContaining({ key: XPUB }) }),
      expect.objectContaining({ useAllAmount: true }),
      undefined,
    );
  });
});

describe("genericSignOperation", () => {
  const deviceSigner = {
    getAddress: jest.fn(async () => ({ publicKey: "02pub", address: ADDRESS, path: ADDRESS_PATH })),
    signTransaction: jest.fn(async () => "device-sig"),
  };
  const signerContext = jest.fn(async (_deviceId, withSigner) => withSigner(deviceSigner)) as never;

  async function sign(
    currencyId: string,
    account: Account,
    transaction: GenericTransaction,
  ): Promise<{ types: string[]; signed: SignedOperation }> {
    const events = await lastValueFrom(
      genericSignOperation(
        currencyId,
        "local",
      )(signerContext)({
        account,
        transaction,
        deviceId: "device",
      }).pipe(toArray()),
    );
    const last = events[events.length - 1] as { signedOperation: SignedOperation };
    return { types: events.map(({ type }) => type), signed: last.signedOperation };
  }

  it("sequences the transaction from the service when it writes for the chain", async () => {
    configure("remote");
    const { types, signed } = await sign(
      "ripple",
      rippleAccountWithFunds(),
      xrpTransaction({ fees: new BigNumber(15) }),
    );

    expect(types).toEqual(["device-signature-requested", "device-signature-granted", "signed"]);
    expect(coinModule.getNextSequence).not.toHaveBeenCalled();
    expect(service.getNextSequence).toHaveBeenCalledWith("xrp", ADDRESS);
    // The sequence reaches the service in its JSON form, the fee parameters with it, present
    // exactly as Ledger Wallet sends them (an empty object).
    expect(serviceCoinModule.craftTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sequence: "7", sender: ADDRESS, senderPublicKey: "02pub" }),
      { customFees: { value: 15n, parameters: {} } },
    );
    expect(service.encodeTransaction).toHaveBeenCalledWith("xrp", {
      intent: expect.objectContaining({
        networkParams: expect.objectContaining({ sequence: "7", feeParameters: {} }),
      }),
      customFees: "15",
    });
    expect(signed.operation.transactionSequenceNumber).toEqual(new BigNumber(7));
    expect(deviceSigner.signTransaction).toHaveBeenCalledWith(
      ADDRESS_PATH,
      "service-unsigned-7",
      expect.anything(),
    );
    expect(signed.signature).toBe("service-unsigned-7+device-sig");
    expect(signed.operation).toMatchObject({ type: "OUT", accountId: RIPPLE_ACCOUNT_ID });

    // The broadcast goes to the service too.
    const broadcasted = await genericBroadcast(
      "ripple",
      "local",
    )({
      signedOperation: signed,
      account: rippleAccountWithFunds(),
    });
    // The service broadcasts without the broadcast config.
    expect(serviceCoinModule.broadcast).toHaveBeenCalledWith(
      expect.anything(),
      "service-unsigned-7+device-sig",
      undefined,
    );
    expect(broadcasted.hash).toBe("service-hash");
    expect(coinModule.broadcast).not.toHaveBeenCalled();
  });

  it.each([
    ["the legacy path", undefined],
    ["the portfolio layer", "local" as const],
  ])(
    "does not reuse the sequence of a pending send on %s, the network lagging behind",
    async (_name, mode) => {
      configure(mode);
      const transaction = xrpTransaction({ fees: new BigNumber(12) });
      const first = await sign("ripple", rippleAccountWithFunds(), transaction);
      const pending = { ...first.signed.operation, hash: "first-hash" };

      await sign(
        "ripple",
        rippleAccount({
          balance: new BigNumber(1_000),
          spendableBalance: new BigNumber(1_000),
          pendingOperations: [pending],
        }),
        transaction,
      );

      // The network still answers 7: the second send must take 8.
      expect(coinModule.craftTransaction.mock.calls.map(([, intent]) => intent.sequence)).toEqual([
        7n,
        8n,
      ]);
    },
  );

  it("sequences the transaction itself on the legacy path", async () => {
    configure(undefined);
    const { signed } = await sign(
      "ripple",
      rippleAccountWithFunds(),
      xrpTransaction({ fees: new BigNumber(12) }),
    );

    expect(coinModule.getNextSequence).toHaveBeenCalledWith(expect.anything(), ADDRESS);
    expect(signed.signature).toBe("unsigned-7+device-sig");
    expect(signed.operation.transactionSequenceNumber).toEqual(new BigNumber(7));
  });

  it("keeps the nonce the transaction sets on the legacy path", async () => {
    configure(undefined);
    const { signed } = await sign(
      "ripple",
      rippleAccountWithFunds(),
      xrpTransaction({ fees: new BigNumber(12), nonce: new BigNumber(3) } as never),
    );

    expect(coinModule.getNextSequence).not.toHaveBeenCalled();
    expect(signed.signature).toBe("unsigned-3+device-sig");
  });

  it("crafts locally in hybrid mode, completing the pending operation from the account module's", async () => {
    configure("hybrid");
    const module = fakeAccountModule();
    const decorateOptimisticOperation = jest.fn((operation: Operation) => ({
      ...operation,
      decorated: true,
    }));
    (getBridgeApi as jest.Mock).mockResolvedValue({
      accountModule: fakeBinding(module, { decorateOptimisticOperation }),
    });
    const { types, signed } = await sign(
      "bitcoin",
      bitcoinAccount(),
      xrpTransaction({ family: "bitcoin", fees: new BigNumber(1_000) }),
    );

    // The family signer reports the device steps itself.
    expect(types).toEqual(["signed"]);
    expect(module.craftTransaction).toHaveBeenCalled();
    expect(module.combine).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ transaction: "psbt" }),
      ["device-sig"],
      { pubkey: "02pub" },
    );
    expect(service.encodeTransaction).not.toHaveBeenCalled();
    // A local write needs nothing from the service.
    expect(service.getPortfolio).not.toHaveBeenCalled();
    expect(signed.signature).toBe("signed-psbt");
    // The operation the account module crafted comes back through the portfolio.
    expect(decorateOptimisticOperation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ transaction: "psbt", operation: CRAFTED_OPERATION }),
      expect.anything(),
      expect.anything(),
    );
    expect(signed.operation).toMatchObject({
      decorated: true,
      value: new BigNumber(51_000),
      fee: new BigNumber(1_000),
      extra: expect.objectContaining({ inputs: ["prev-0"] }),
    });
  });

  it("decorates the operation the account module crafted on the legacy path", async () => {
    configure(undefined);
    const module = fakeAccountModule();
    const decorateOptimisticOperation = jest.fn((operation: Operation) => ({
      ...operation,
      decorated: true,
    }));
    (getBridgeApi as jest.Mock).mockResolvedValue({
      accountModule: fakeBinding(module, { decorateOptimisticOperation }),
    });

    const { signed } = await sign(
      "bitcoin",
      bitcoinAccount(),
      xrpTransaction({ family: "bitcoin", fees: new BigNumber(1_000) }),
    );

    expect(decorateOptimisticOperation).toHaveBeenCalled();
    expect(signed.operation).toMatchObject({ decorated: true, value: new BigNumber(51_000) });
  });
});

const signedOperation = (): SignedOperation => ({
  signature: "signed",
  operation: {
    id: "",
    hash: "",
    type: "OUT",
    accountId: RIPPLE_ACCOUNT_ID,
  } as Operation,
});

describe("genericBroadcast", () => {
  it.each(["local", "hybrid"] as const)(
    "broadcasts with the client's coin module and the broadcast config when it writes (%s)",
    async mode => {
      configure(mode);
      service.getPortfolio.mockRejectedValue(new Error("service down"));
      const operation = await genericBroadcast(
        "ripple",
        "local",
      )({
        signedOperation: signedOperation(),
        account: rippleAccountWithFunds(),
        broadcastConfig: { mevProtected: true },
      });

      expect(coinModule.broadcast).toHaveBeenCalledWith(expect.anything(), "signed", {
        broadcastConfig: { mevProtected: true },
      });
      expect(operation).toMatchObject({
        hash: "broadcast-hash",
        id: encodeOperationId(RIPPLE_ACCOUNT_ID, "broadcast-hash", "OUT"),
      });
      expect(service.broadcastTransaction).not.toHaveBeenCalled();
    },
  );

  it("broadcasts with the coin module and its config otherwise", async () => {
    configure(undefined);
    const operation = await genericBroadcast(
      "ripple",
      "local",
    )({
      signedOperation: signedOperation(),
      account: rippleAccountWithFunds(),
      broadcastConfig: { mevProtected: true },
    });

    expect(coinModule.broadcast).toHaveBeenCalledWith(expect.anything(), "signed", {
      broadcastConfig: { mevProtected: true },
    });
    expect(operation.hash).toBe("broadcast-hash");
  });

  it("still lets the family reject the transaction first", async () => {
    configure("local");
    const rejected = new Error("invalid transaction");
    (getBridgeApi as jest.Mock).mockResolvedValue({
      validateTransaction: jest.fn(async () => ({ error: rejected })),
    });
    await expect(
      genericBroadcast(
        "ripple",
        "local",
      )({
        signedOperation: signedOperation(),
        account: rippleAccountWithFunds(),
      }),
    ).rejects.toBe(rejected);
    expect(coinModule.broadcast).not.toHaveBeenCalled();
  });
});

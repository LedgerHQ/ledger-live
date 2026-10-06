import { setupServer } from "msw/node";
import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from "@ledgerhq/coin-aleo/api";
import type { AleoAccount, AleoOperation } from "@ledgerhq/coin-aleo/types";
import { killStack, registerTeardownHooks, spawnStack } from "./stack";
import {
  ALEO,
  PUBLIC_DEVNODE_FEE_RANGE,
  buildAleoCoinConfig,
  generateAleoAccount,
  makeAleoAccount,
  type GeneratedAleoAccount,
} from "./fixtures";
import { advanceBlocks, getBlocksFrom } from "./devnode";
import type { DevnodeConfirmedTransaction, DevnodeTransition } from "./devnode";
import { getAccountTransactionRows } from "./msw/indexer";
import { buildTransaction } from "./msw/prove";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import { createFakeScanner } from "./msw/scanner";
import { buildMockAleoSigner } from "./signer";
import { getBridges } from "./helpers";
import { fundFromGenesis, startMockServer, syncAccount } from "./testSetup";

jest.setTimeout(600_000);

registerTeardownHooks();

beforeAll(async () => {
  await spawnStack();
});

afterAll(async () => {
  await killStack();
});

type ConfirmedTransactionWithRejection = DevnodeConfirmedTransaction & {
  rejected?: { type: string; execution?: { transitions: DevnodeTransition[] } };
};

async function findNonAcceptedTransaction(): Promise<ConfirmedTransactionWithRejection | null> {
  for (const block of await getBlocksFrom(0)) {
    for (const confirmed of (block.transactions ?? []) as ConfirmedTransactionWithRejection[]) {
      if (confirmed.status !== "accepted") return confirmed;
    }
  }

  return null;
}

describe("a public transfer whose finalize aborts", () => {
  // Enough for `fee_public` to finalize (else the tx never enters a block), not for the transfer.
  const FEE_ONLY_FUNDING = PUBLIC_DEVNODE_FEE_RANGE.max * 3;
  const OVERSPEND = 10_000_000_000_000;

  let sender: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  let rejected: ConfirmedTransactionWithRejection | null = null;
  let rejectedTransitions: DevnodeTransition[] = [];
  let operations: AleoOperation[] = [];
  const mockServer = setupServer();

  beforeAll(
    async () => {
      [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      startMockServer(mockServer);
      mockServer.use(...buildAleoHandlers({ recipient: sender.address, amount: 0 }));

      await fundFromGenesis(sender.address, FEE_ONLY_FUNDING);

      // Bypasses the bridge, which would refuse it upfront with NotEnoughBalance.
      await buildTransaction({
        recipient: recipient.address,
        amount: OVERSPEND,
        senderPrivateKey: sender.privateKey,
      });
      await advanceBlocks(1);

      rejected = await findNonAcceptedTransaction();
      rejectedTransitions = rejected?.rejected?.execution?.transitions ?? [];

      const signer = buildMockAleoSigner(sender.privateKey);
      const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
      const account = makeAleoAccount(sender.address, sender.viewKey);

      const synced = await syncAccount(accountBridge, account);
      operations = synced.operations as AleoOperation[];
    },
    15 * 60 * 1000,
  );

  afterAll(() => {
    mockServer.close();
  });

  it("is confirmed as rejected, with a fee transaction stored in the execution's place", () => {
    expect(rejected).not.toBeNull();
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.type).toBe("execute");
    expect(rejected?.transaction.type).toBe("fee");
    expect(rejected?.transaction.execution).toBeUndefined();
    expect(rejected?.transaction.fee).toBeDefined();
    expect(rejected?.rejected?.type).toBe("execution");
    expect(
      rejectedTransitions.map(transition => `${transition.program}/${transition.function}`),
    ).toContain("credits.aleo/transfer_public");
  });

  it("reaches the bridge as an operation with hasFailed set", () => {
    const failed = operations.filter(operation => operation.hasFailed);

    expect(failed).toHaveLength(1);
    expect(failed[0].hash).toBe(rejected?.transaction.id);
    expect(failed[0].type).toBe("OUT");
    expect(failed[0].senders).toEqual([sender.address]);
    expect(failed[0].recipients).toEqual([recipient.address]);
  });

  it("leaves the accepted funding transfer unflagged", () => {
    const succeeded = operations.filter(operation => !operation.hasFailed);

    expect(succeeded).toHaveLength(1);
    expect(succeeded[0].type).toBe("IN");
  });
});

describe("listOperations pagination", () => {
  const OPERATION_COUNT = 5;
  const PAGE_SIZE = 2;
  const AMOUNT = 100_000;

  let owner: GeneratedAleoAccount;
  let blockNumbers: number[] = [];
  let wholeListing: Operation[] = [];
  const pages: { items: Operation[]; next?: string }[] = [];
  const mockServer = setupServer();

  beforeAll(
    async () => {
      owner = await generateAleoAccount();

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      startMockServer(mockServer);
      mockServer.use(
        ...buildAleoHandlers({ recipient: owner.address, amount: 0 }),
        ...buildScannerHandlers(scanner),
      );

      for (let index = 0; index < OPERATION_COUNT; index++) {
        await buildTransaction({ recipient: owner.address, amount: AMOUNT });
        await advanceBlocks(1);
      }

      blockNumbers = (await getAccountTransactionRows(owner.address)).map(row => row.block_number);

      const api = createApi(ALEO.id);
      const config = buildAleoCoinConfig();
      const registrationContext = {
        config: async () => config,
        logger: () => {},
        viewKey: owner.viewKey,
      };
      const { provableId } = await api.register(registrationContext, owner.address);
      const context = { ...registrationContext, provableId };

      wholeListing = (await api.listOperations(context, owner.address, { minHeight: 0 })).items;

      let cursor: string | undefined;
      do {
        const page = await api.listOperations(context, owner.address, {
          minHeight: 0,
          limit: PAGE_SIZE,
          ...(cursor && { cursor }),
        });
        pages.push({ items: page.items, next: page.next });
        cursor = page.next;
      } while (cursor && pages.length <= OPERATION_COUNT);
    },
    15 * 60 * 1000,
  );

  afterAll(() => {
    mockServer.close();
  });

  it("indexes every transfer on a block of its own", () => {
    expect(blockNumbers).toHaveLength(OPERATION_COUNT);
    expect(new Set(blockNumbers).size).toBe(OPERATION_COUNT);
  });

  it("lists every operation when asked for no page size", () => {
    expect(wholeListing).toHaveLength(OPERATION_COUNT);
  });

  it("splits the listing into more than one page", () => {
    expect(pages.length).toBeGreaterThan(1);
  });

  it("holds every page to the requested page size", () => {
    expect(pages.map(page => page.items.length).filter(size => size > PAGE_SIZE)).toEqual([]);
  });

  it("stops offering a cursor on the last page", () => {
    expect(pages.at(-1)?.next).toBeUndefined();
  });

  it("covers the whole listing across its pages, with no duplicate and no gap", () => {
    const paged = pages.flatMap(page => page.items).map(operation => operation.tx.hash);
    const whole = wholeListing.map(operation => operation.tx.hash);

    expect(new Set(paged).size).toBe(paged.length);
    expect(paged).toEqual(whole);
  });
});

describe("bridge sync across transaction pages", () => {
  const OPERATION_COUNT = 5;
  const MAX_PAGE_SIZE = 2;
  const AMOUNT = 100_000;

  let owner: GeneratedAleoAccount;
  let synced: AleoAccount;
  const mockServer = setupServer();

  beforeAll(
    async () => {
      owner = await generateAleoAccount();

      startMockServer(mockServer);
      // The bridge asks for 50 rows a page; the cap forces it through several.
      mockServer.use(
        ...buildAleoHandlers(
          { recipient: owner.address, amount: 0 },
          { maxPageSize: MAX_PAGE_SIZE },
        ),
      );

      for (let index = 0; index < OPERATION_COUNT; index++) {
        await buildTransaction({ recipient: owner.address, amount: AMOUNT });
        await advanceBlocks(1);
      }

      const { accountBridge } = getBridges(
        buildMockAleoSigner(owner.privateKey),
        buildAleoCoinConfig(),
      );
      synced = await syncAccount(accountBridge, makeAleoAccount(owner.address, owner.viewKey));
    },
    15 * 60 * 1000,
  );

  afterAll(() => {
    mockServer.close();
  });

  it("syncs every transfer, with no duplicate and no gap", () => {
    const hashes = synced.operations.map(operation => operation.hash);

    expect(hashes).toHaveLength(OPERATION_COUNT);
    expect(new Set(hashes).size).toBe(OPERATION_COUNT);
    expect(synced.operations.every(operation => operation.type === "IN")).toBe(true);
  });
});

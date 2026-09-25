import { firstValueFrom, reduce } from "rxjs";
import { http, HttpResponse, type RequestHandler } from "msw";
import { setupServer } from "msw/node";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from "@ledgerhq/coin-aleo/api";
import type { AleoOperation } from "@ledgerhq/coin-aleo/types";
import { advanceBlocks, killStack, registerTeardownHooks, spawnStack } from "./stack";
import {
  ALEO,
  ALEO_FAKE_NODE,
  ALEO_NETWORK_TYPE,
  PUBLIC_DEVNODE_FEE_RANGE,
  buildAleoCoinConfig,
  generateAleoAccount,
  getPublicBalance,
  makeAleoAccount,
  type GeneratedAleoAccount,
} from "./fixtures";
import { getBlock, getLatestHeight } from "./devnode";
import type { DevnodeConfirmedTransaction, DevnodeTransition } from "./devnode";
import { getAccountTransactionRows } from "./msw/indexer";
import { buildTransaction } from "./msw/prove";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import { createFakeScanner } from "./msw/scanner";
import { buildMockAleoSigner } from "./signer";
import { getBridges } from "./helpers";

jest.setTimeout(600_000);

registerTeardownHooks();

beforeAll(async () => {
  await spawnStack();
});

afterAll(async () => {
  await killStack();
});

/** What `Rejected::Execution` adds to a confirmed transaction; see msw/indexer.ts. */
type ConfirmedTransactionWithRejection = DevnodeConfirmedTransaction & {
  rejected?: { type: string; execution?: { transitions: DevnodeTransition[] } };
};

function startMockServer(server: ReturnType<typeof setupServer>): void {
  server.listen({
    onUnhandledRequest: request => {
      const { hostname } = new URL(request.url);
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });
}

/**
 * Sends `amount` straight to the devnode from GENESIS_ACCOUNT, bypassing the
 * bridge under test, and waits until `recipientAddress`'s public balance
 * reflects it.
 */
async function fundFromGenesis(recipientAddress: string, amount: number): Promise<void> {
  await buildTransaction({ recipient: recipientAddress, amount });

  for (let attempt = 0; attempt < 10; attempt++) {
    await advanceBlocks(1);
    if ((await getPublicBalance(recipientAddress)) >= BigInt(amount)) return;
  }

  throw new Error(`aleo coin-tester: funding transfer to ${recipientAddress} did not confirm`);
}

/** The first confirmed transaction the chain did not accept, scanning from block 0. */
async function findNonAcceptedTransaction(): Promise<ConfirmedTransactionWithRejection | null> {
  const latest = await getLatestHeight();

  for (let height = 0; height <= latest; height++) {
    const block = await getBlock(height);
    for (const confirmed of (block.transactions ?? []) as ConfirmedTransactionWithRejection[]) {
      if (confirmed.status !== "accepted") return confirmed;
    }
  }

  return null;
}

describe("a public transfer whose finalize aborts", () => {
  /**
   * Funds the fee and nothing else: `fee_public` must finalize (otherwise the
   * whole transaction is aborted and never enters a block) while
   * `transfer_public`'s own finalize underflows on `sub`.
   */
  const FUNDING = PUBLIC_DEVNODE_FEE_RANGE.max * 3;
  /** Orders of magnitude above FUNDING, so the finalize cannot succeed. */
  const OVERSPEND = 10_000_000_000_000;

  let sender: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  let rejected: ConfirmedTransactionWithRejection | null = null;
  let rejectedTransitions: DevnodeTransition[] = [];
  let operations: AleoOperation[] = [];
  const mockServer = setupServer();

  beforeAll(
    async () => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      startMockServer(mockServer);
      mockServer.use(...buildAleoHandlers({ recipient: sender.address, amount: 0 }));

      await fundFromGenesis(sender.address, FUNDING);

      // Straight to the devnode, signed as `sender`: the bridge would refuse to
      // build this transfer at all (NotEnoughBalance), and what this test needs
      // is a transaction the chain itself refuses at finalize time.
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

      const synced = await firstValueFrom(
        accountBridge
          .sync(account, { paginationConfig: {} })
          .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
      );
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
    // snarkVM's ConfirmedTransaction::rejected_execute requires a fee
    // transaction here, so the execution moves to the sibling `rejected` field.
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

/**
 * `getAccountTransactionRows` returns every row for an address, oldest first,
 * so a page is a slice of it. coin-aleo's cursor is a bare block number
 * (`cursor_block_number`, taken from the last row of the previous page), which
 * only paginates cleanly when no two rows share a block — the devnode seals one
 * block per broadcast, so the fixture below holds.
 */
function buildPaginatedTransactionsHandler(): RequestHandler {
  return http.get(
    `${ALEO_FAKE_NODE}/v2/${ALEO_NETWORK_TYPE}/transactions/address/:address`,
    async ({ params, request }) => {
      const address = String(params.address);
      const url = new URL(request.url);
      const limit = Number(url.searchParams.get("limit") ?? "50");
      const cursor = url.searchParams.get("cursor_block_number");

      const rows = await getAccountTransactionRows(address);
      const remaining =
        cursor === null ? rows : rows.filter(row => row.block_number > Number(cursor));
      const page = remaining.slice(0, limit);
      const last = page.at(-1);

      return HttpResponse.json({
        address,
        transactions: page,
        ...(last &&
          remaining.length > page.length && {
            next_cursor: { block_number: last.block_number, transition_id: last.transition_id },
          }),
      });
    },
  );
}

describe("listOperations pagination", () => {
  const OPERATION_COUNT = 5;
  /** Not a divisor of OPERATION_COUNT, so the last page is short and carries no cursor. */
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
      // A second `use` call, so the paginating route is prepended ahead of the
      // non-paginating one buildAleoHandlers registers for the same path.
      mockServer.use(buildPaginatedTransactionsHandler());

      // One broadcast per block: each seals before the next is built, so every
      // row lands on a block number of its own.
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

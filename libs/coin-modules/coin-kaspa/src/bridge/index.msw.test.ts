import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { ScanAccountEvent } from "@ledgerhq/types-live";
import { http, HttpResponse } from "msw";
import { lastValueFrom, reduce, toArray } from "rxjs";
import KaspaBIP32 from "../logic/bip32";
import { parseExtendedPublicKey } from "../logic";
import { TEST_KASPA_ENDPOINT, server } from "../test/msw.mock";
import { SECOND_XPUB, XPUB } from "../test/fixtures";
import type { KaspaAccount, KaspaSigner } from "../types";
import { createBridges } from "./index";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const deriveAddresses = (xpub: string) => {
  const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(xpub, "hex"));
  const bip32 = new KaspaBIP32(compressedPublicKey, chainCode);
  return {
    receive: (index: number) => bip32.getAddress(0, index),
    change: (index: number) => bip32.getAddress(1, index),
  };
};

const FUNDED = deriveAddresses(XPUB);
const EMPTY = deriveAddresses(SECOND_XPUB);
const EXTERNAL_A = FUNDED.receive(999);
const EXTERNAL_B = FUNDED.receive(998);

const XPUB_BY_INDEX = [XPUB, SECOND_XPUB];

const signer: KaspaSigner = {
  getAddress: jest.fn(async (path: string) => {
    const index = Number(/^44'\/111111'\/(\d+)'/.exec(path)?.[1]);
    const publicKey = XPUB_BY_INDEX[index];
    if (!publicKey) throw new Error(`unexpected derivation path ${path}`);
    return { address: `kaspa-placeholder-${index}`, publicKey };
  }),
  signMessage: jest.fn(),
  signTransaction: jest.fn(),
};

const signerContext = ((_deviceId: string, fn: (signer: KaspaSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<KaspaSigner>;

const OLDER_TIME = 1700000100000;
const NEWER_TIME = 1700000200000;
const PAST_MEDIAN_TIME = 1700001000000;
const TWO_HOURS = 2 * 60 * 60 * 1000;

const transaction = ({
  id,
  blueScore,
  time,
  inputs,
  outputs,
}: {
  id: string;
  blueScore: number;
  time: number;
  inputs: { address: string; amount: number }[];
  outputs: { address: string; amount: number }[];
}) => ({
  subnetwork_id: "0000000000000000000000000000000000000000",
  transaction_id: id,
  hash: id,
  mass: "2000",
  block_hash: [`block-${id}`],
  block_time: time,
  is_accepted: true,
  accepting_block_hash: `accepting-${id}`,
  accepting_block_blue_score: blueScore,
  inputs: inputs.map((input, index) => ({
    transaction_id: id,
    index,
    previous_outpoint_hash: `previous-${id}-${index}`,
    previous_outpoint_index: "0",
    previous_outpoint_address: input.address,
    previous_outpoint_amount: input.amount,
  })),
  outputs: outputs.map((output, index) => ({
    transaction_id: id,
    index,
    amount: output.amount,
    script_public_key_address: output.address,
  })),
});

const RECEIVE_TX = transaction({
  id: "tx-receive",
  blueScore: 100,
  time: OLDER_TIME,
  inputs: [{ address: EXTERNAL_A, amount: 600000000 }],
  outputs: [
    { address: FUNDED.receive(0), amount: 500000000 },
    { address: EXTERNAL_B, amount: 99999000 },
  ],
});

const SEND_TX = transaction({
  id: "tx-send",
  blueScore: 200,
  time: NEWER_TIME,
  inputs: [{ address: FUNDED.receive(0), amount: 500000000 }],
  outputs: [
    { address: EXTERNAL_B, amount: 100000000 },
    { address: FUNDED.change(0), amount: 399998000 },
  ],
});

const FUNDED_STATE: Record<string, { balance: number; lastTxBlockTime: number }> = {
  [FUNDED.receive(0)]: { balance: 0, lastTxBlockTime: OLDER_TIME },
  [FUNDED.change(0)]: { balance: 399998000, lastTxBlockTime: NEWER_TIME },
};

const TRANSACTIONS_BY_ADDRESS: Record<string, unknown[]> = {
  [FUNDED.receive(0)]: [RECEIVE_TX, SEND_TX],
  [FUNDED.change(0)]: [SEND_TX],
};

const requestedAfters: Record<string, string | null> = {};

const serveChain = () => {
  server.use(
    http.post(`${TEST_KASPA_ENDPOINT}/addresses/balances`, async ({ request }) => {
      const { addresses } = (await request.json()) as { addresses: string[] };
      return HttpResponse.json(
        addresses.map(address => ({ address, balance: FUNDED_STATE[address]?.balance ?? 0 })),
      );
    }),
    http.post(`${TEST_KASPA_ENDPOINT}/addresses/active`, async ({ request }) => {
      const { addresses } = (await request.json()) as { addresses: string[] };
      return HttpResponse.json(
        addresses.map(address => ({
          address,
          active: address in FUNDED_STATE,
          lastTxBlockTime: FUNDED_STATE[address]?.lastTxBlockTime ?? 0,
        })),
      );
    }),
    http.get(
      `${TEST_KASPA_ENDPOINT}/addresses/:address/full-transactions-page`,
      ({ params, request }) => {
        const address = decodeURIComponent(String(params.address));
        requestedAfters[address] = new URL(request.url).searchParams.get("after");
        return HttpResponse.json(TRANSACTIONS_BY_ADDRESS[address] ?? []);
      },
    ),
    http.get(`${TEST_KASPA_ENDPOINT}/info/blockdag`, () =>
      HttpResponse.json({ pastMedianTime: String(PAST_MEDIAN_TIME) }),
    ),
    http.get(`${TEST_KASPA_ENDPOINT}/info/virtual-chain-blue-score`, () =>
      HttpResponse.json({ blueScore: 480000000 }),
    ),
  );
};

const scan = async (): Promise<KaspaAccount[]> => {
  const events = await lastValueFrom(
    createBridges(signerContext)
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("kaspa"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as KaspaAccount);
};

const resync = (account: KaspaAccount): Promise<KaspaAccount> =>
  lastValueFrom(
    createBridges(signerContext)
      .accountBridge.sync(account, { paginationConfig: {}, blacklistedTokenIds: [] })
      .pipe(reduce((current, updater) => updater(current), account)),
  );

describe("currencyBridge.scanAccounts via MSW", () => {
  beforeEach(() => {
    Object.keys(requestedAfters).forEach(key => delete requestedAfters[key]);
    serveChain();
  });

  it("discovers the funded account then one empty account with the kaspa account shape", async () => {
    const accounts = await scan();

    expect(accounts).toMatchObject([
      {
        id: `js:2:kaspa:${XPUB}:`,
        index: 0,
        derivationMode: "",
        xpub: XPUB,
        freshAddress: FUNDED.receive(1),
        freshAddressPath: "44'/111111'/0'/0/1",
        used: true,
        blockHeight: 480000000,
        lastSyncTimestamp: PAST_MEDIAN_TIME,
        operationsCount: 2,
        nextReceiveAddress: FUNDED.receive(1),
        nextReceiveAddressIndex: 1,
        nextReceiveAddressType: 0,
        nextChangeAddress: FUNDED.change(1),
        nextChangeAddressIndex: 1,
        nextChangeAddressType: 1,
        activeAddressCount: 1,
      },
      {
        id: `js:2:kaspa:${SECOND_XPUB}:`,
        index: 1,
        derivationMode: "",
        xpub: SECOND_XPUB,
        freshAddress: EMPTY.receive(0),
        freshAddressPath: "44'/111111'/1'/0/0",
        used: false,
        operationsCount: 0,
        activeAddressCount: 0,
      },
    ]);
  });

  it("sums the balances of the used addresses into the balance and the spendable balance", async () => {
    const [funded, empty] = await scan();

    expect({
      funded: [funded.balance.toString(), funded.spendableBalance.toString()],
      empty: [empty.balance.toString(), empty.spendableBalance.toString()],
    }).toEqual({ funded: ["399998000", "399998000"], empty: ["0", "0"] });
  });

  it("converts the fetched transactions of the used addresses into deduplicated operations", async () => {
    const [funded] = await scan();

    expect(
      funded.operations.map(op => ({
        hash: op.hash,
        type: op.type,
        value: op.value.toString(),
        fee: op.fee.toString(),
        blockHeight: op.blockHeight,
        senders: op.senders,
        recipients: op.recipients,
      })),
    ).toEqual([
      {
        hash: "tx-send",
        type: "OUT",
        value: "100002000",
        fee: "2000",
        blockHeight: 200,
        senders: [FUNDED.receive(0)],
        recipients: [EXTERNAL_B, FUNDED.change(0)],
      },
      {
        hash: "tx-receive",
        type: "IN",
        value: "500000000",
        fee: "1000",
        blockHeight: 100,
        senders: [EXTERNAL_A],
        recipients: [FUNDED.receive(0), EXTERNAL_B],
      },
    ]);
  });

  it("fetches the whole history of the used addresses on the first scan", async () => {
    await scan();

    expect(requestedAfters[FUNDED.receive(0)]).toBe("1");
  });

  describe("resync of an account with existing history", () => {
    it("restores the missing newest operations without duplicating the existing ones", async () => {
      const [funded] = await scan();
      const partial = { ...funded, operations: funded.operations.slice(1) };

      const synced = await resync(partial);

      expect(synced.operations.map(op => op.id)).toEqual(funded.operations.map(op => op.id));
    });

    it("rescans the transactions from two hours before the last sync", async () => {
      const [funded] = await scan();

      await resync(funded);

      expect(requestedAfters[FUNDED.receive(0)]).toBe(String(PAST_MEDIAN_TIME - TWO_HOURS));
    });

    it("keeps the references of the existing operations", async () => {
      const [funded] = await scan();
      const existing = funded.operations.slice(1);
      const partial = { ...funded, operations: existing };

      const synced = await resync(partial);

      expect(synced.operations.slice(1).every((op, index) => op === existing[index])).toBe(true);
    });

    it("keeps a recent pending operation that is not in the fetched history", async () => {
      const [funded] = await scan();
      const pending = {
        ...funded.operations[0],
        id: "pending-op",
        hash: "pending-hash",
        date: new Date(),
      };

      const synced = await resync({ ...funded, pendingOperations: [pending] });

      expect(synced.pendingOperations.map(op => op.hash)).toEqual(["pending-hash"]);
    });

    it("drops a pending operation once it is older than the optimistic retention", async () => {
      const [funded] = await scan();
      const pending = {
        ...funded.operations[0],
        id: "pending-op",
        hash: "pending-hash",
        date: new Date(0),
      };

      const synced = await resync({ ...funded, pendingOperations: [pending] });

      expect(synced.pendingOperations).toEqual([]);
    });
  });
});

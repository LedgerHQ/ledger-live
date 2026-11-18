import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { http, HttpResponse } from "msw";
import { lastValueFrom, toArray } from "rxjs";
import { TEST_STACKS_ENDPOINT, server } from "../test/msw.mock";
import type { StacksSigner } from "../types";
import { createBridges } from "./index";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const FUNDED = {
  address: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
  publicKey: "022a460decc9dba8c452927fecb33d7ae25a8d79dc5442b84feaf8f3aa0e2b575d",
};
const EMPTY = {
  address: "SP2A6F6R7F29Z38S2YCJM7HJDVE24S2VGWT5BTZPA",
  publicKey: "03a2d4bbb54c2f44c3a205b15ca7d2049a2bb66e50e100304f932b3b99ed3a99cb",
};
const RECIPIENT = "SP2DV2RVZP1A69Q6VAG5PHEQ6ZHQHZPCV84TMYNGN";

const TOKEN_CONTRACT = "sp3brxz9y7p5yp28psr8yjt39rt51zzbsectcadgr.skullcoin-stxcity::skull";
const TOKEN = {
  type: "TokenCurrency",
  id: "stacks/sip010/skullcoin~!underscore!~sp3brxz9y7p5yp28psr8yjt39rt51zzbsectcadgr.skullcoin~!dash!~stxcity::skull",
  contractAddress: TOKEN_CONTRACT,
  parentCurrencyId: "stacks",
  name: "SKULL",
  tokenType: "sip010",
  ticker: "SKULL",
  disableCountervalue: false,
  delisted: false,
  units: [{ name: "SKULL", code: "SKULL", magnitude: 6 }],
} as unknown as TokenCurrency;

const FUNDED_ACCOUNT_ID = `js:2:stacks:${FUNDED.publicKey}:`;
const TOKEN_ACCOUNT_ID = encodeTokenAccountId(FUNDED_ACCOUNT_ID, TOKEN);

const KEYS_BY_PATH: Record<string, typeof FUNDED> = {
  "m/44'/5757'/0'/0/0": FUNDED,
  "m/44'/5757'/0'/0/1": EMPTY,
  "m/44'/5757'/1'/0/0": EMPTY,
};

const signer: StacksSigner = {
  getAddressAndPubKey: jest.fn(async (path: string) => {
    const keys = KEYS_BY_PATH[path];
    if (!keys) throw new Error(`unexpected derivation path ${path}`);
    return {
      returnCode: 0x9000,
      errorMessage: "No errors",
      address: keys.address,
      publicKey: Buffer.from(keys.publicKey, "hex"),
    };
  }) as unknown as StacksSigner["getAddressAndPubKey"],
  showAddressAndPubKey: jest.fn(),
  sign: jest.fn(),
};

const signerContext = ((_deviceId: string, fn: (signer: StacksSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<StacksSigner>;

const BASE = `${TEST_STACKS_ENDPOINT}/extended`;

const page = <T>(results: T[]) =>
  HttpResponse.json({ limit: 50, offset: 0, total: results.length, results });

const outgoingTransfer = {
  tx: {
    tx_id: "0xtx-out",
    nonce: 1,
    fee_rate: "1000",
    sender_address: FUNDED.address,
    sponsored: false,
    post_condition_mode: "deny",
    post_conditions: [],
    anchor_mode: "any",
    is_unanchored: false,
    block_hash: "0xblock1",
    parent_block_hash: "0xparent",
    block_height: 100,
    block_time: 1700000000,
    block_time_iso: "",
    burn_block_time: 1700000000,
    burn_block_time_iso: "",
    parent_burn_block_time: 0,
    parent_burn_block_time_iso: "",
    canonical: true,
    tx_index: 0,
    tx_status: "success",
    tx_result: { hex: "0x0703", repr: "(ok true)" },
    microblock_hash: "0x",
    microblock_sequence: 0,
    microblock_canonical: true,
    event_count: 1,
    execution_cost_read_count: 0,
    execution_cost_read_length: 0,
    execution_cost_runtime: 0,
    execution_cost_write_count: 0,
    execution_cost_write_length: 0,
    events: [],
    tx_type: "token_transfer",
    token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
  },
  stx_sent: "2000",
  stx_received: "0",
  events: {
    stx: { transfer: 1, mint: 0, burn: 0 },
    ft: { transfer: 0, mint: 0, burn: 0 },
    nft: { transfer: 0, mint: 0, burn: 0 },
  },
};

const stxBalance = (balance: string) => ({
  balance,
  total_miner_rewards_received: "0",
  lock_tx_id: "",
  locked: "0",
  lock_height: 0,
  burnchain_lock_height: 0,
  burnchain_unlock_height: 0,
});

const serveChain = () => {
  server.use(
    http.get(`${BASE}`, () => HttpResponse.json({ chain_tip: { block_height: 350000 } })),
    http.get(`${TEST_STACKS_ENDPOINT}/v2/pox`, () =>
      HttpResponse.json({
        contract_id: "SP000000000000000000002Q6VF78.pox-5",
        current_cycle: { id: 100 },
      }),
    ),
    http.post(`${TEST_STACKS_ENDPOINT}/v2/contracts/call-read/:address/:name/get-staker-info`, () =>
      HttpResponse.json({ okay: true, result: "0x09" }),
    ),
    http.get(`${BASE}/v2/addresses/${FUNDED.address}/balances/stx`, () =>
      HttpResponse.json(stxBalance("1000000")),
    ),
    http.get(`${BASE}/v2/addresses/${EMPTY.address}/balances/stx`, () =>
      HttpResponse.json(stxBalance("0")),
    ),
    http.get(`${BASE}/v2/addresses/${FUNDED.address}/balances/ft`, () =>
      page([{ token: TOKEN_CONTRACT, balance: "5000" }]),
    ),
    http.get(`${BASE}/v2/addresses/${EMPTY.address}/balances/ft`, () => page([])),
    http.get(`${BASE}/v2/addresses/${FUNDED.address}/transactions`, () => page([outgoingTransfer])),
    http.get(`${BASE}/v2/addresses/${EMPTY.address}/transactions`, () => page([])),
    http.get(`${BASE}/v1/tx/mempool`, () => page([])),
  );
};

const scan = async (): Promise<Account[]> => {
  const events = await lastValueFrom(
    createBridges(signerContext)
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("stacks"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account);
};

describe("currencyBridge.scanAccounts via MSW", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async address =>
        address === TOKEN_CONTRACT ? TOKEN : undefined,
      findTokenById: async id => (id === TOKEN.id ? TOKEN : undefined),
      getTokensSyncHash: async () => "0",
    });
  });

  beforeEach(serveChain);

  it("discovers the funded account then one empty account with the stacks account shape", async () => {
    const accounts = await scan();

    expect(accounts).toMatchObject([
      {
        id: FUNDED_ACCOUNT_ID,
        index: 0,
        derivationMode: "",
        seedIdentifier: FUNDED.publicKey,
        freshAddress: FUNDED.address,
        freshAddressPath: "44'/5757'/0'/0/0",
        xpub: FUNDED.publicKey,
        used: true,
        blockHeight: 350000,
        stakingPositions: [],
        operationsCount: 1,
      },
      {
        id: `js:2:stacks:${EMPTY.publicKey}:`,
        index: 1,
        derivationMode: "",
        seedIdentifier: FUNDED.publicKey,
        freshAddress: EMPTY.address,
        freshAddressPath: "44'/5757'/1'/0/0",
        xpub: EMPTY.publicKey,
        used: false,
        operationsCount: 0,
      },
    ]);
    expect(accounts.map(account => account.balance.toString())).toEqual(["1000000", "0"]);
  });

  it("builds the token sub account of the funded account from its token balance", async () => {
    const [funded, empty] = await scan();

    expect(funded.subAccounts).toMatchObject([
      {
        type: "TokenAccount",
        id: TOKEN_ACCOUNT_ID,
        parentId: FUNDED_ACCOUNT_ID,
        token: { id: TOKEN.id },
        operationsCount: 0,
      },
    ]);
    expect(funded.subAccounts?.[0].balance.toString()).toBe("5000");
    expect(empty.subAccounts).toEqual([]);
  });

  it("converts the fetched transactions of the funded account into operations", async () => {
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
        hash: "0xtx-out",
        type: "OUT",
        value: "2000",
        fee: "1000",
        blockHeight: 100,
        senders: [FUNDED.address],
        recipients: [RECIPIENT],
      },
    ]);
  });
});

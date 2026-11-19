import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { http, HttpResponse } from "msw";
import { lastValueFrom, toArray } from "rxjs";
import { server, useMswServer } from "../logic/tests/msw";
import type { MultiversXSigner } from "../signer";
import { ACCOUNT_ADDRESS, DELEGATION_CONTRACT, MEX_TOKEN, OTHER_ADDRESS } from "../test/fixtures";
import { buildCurrencyBridge } from "./js";

const API = "https://elrond.coin.ledger.com";
const DELEGATION = "https://delegations-elrond.coin.ledger.com";

const PUBLIC_KEYS: Record<string, string> = {
  [ACCOUNT_ADDRESS]: "6213187a3f9e8d1c",
  [OTHER_ADDRESS]: "0ee3a3b2bd8c3a1f",
};

const ADDRESS_BY_INDEX: Record<string, string> = {
  "0": ACCOUNT_ADDRESS,
  "1": OTHER_ADDRESS,
};

const signer: MultiversXSigner = {
  getAddress: jest.fn(async (path: string) => {
    const index = /^44'\/508'\/(\d+)'/.exec(path)?.[1];
    const address = index === undefined ? undefined : ADDRESS_BY_INDEX[index];
    if (!address) throw new Error(`unexpected derivation path ${path}`);
    return { address, publicKey: PUBLIC_KEYS[address] };
  }),
  setAddress: jest.fn(),
  sign: jest.fn(),
  provideESDTInfo: jest.fn(),
};

const signerContext = ((_deviceId: string, fn: (signer: MultiversXSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<MultiversXSigner>;

const sendTransaction = {
  txHash: "hash-send",
  sender: ACCOUNT_ADDRESS,
  receiver: OTHER_ADDRESS,
  value: "1000000000000000000",
  fee: "50000000000000",
  round: 6000100,
  timestamp: 1700000100,
  miniBlockHash: "miniblock-send",
  nonce: 3,
  status: "success",
};

const esdtTransaction = {
  txHash: "hash-esdt",
  sender: OTHER_ADDRESS,
  receiver: ACCOUNT_ADDRESS,
  value: "0",
  fee: "0",
  round: 6000050,
  timestamp: 1700000050,
  miniBlockHash: "miniblock-esdt",
  nonce: 9,
  status: "success",
  action: {
    name: "transfer",
    arguments: { transfers: [{ token: "MEX-455c57", value: "100" }] },
  },
};

const delegation = {
  address: ACCOUNT_ADDRESS,
  contract: DELEGATION_CONTRACT,
  userUnBondable: "0",
  userActiveStake: "2000000000000000000",
  claimableRewards: "0",
  userUndelegatedList: [],
};

const serveChain = () => {
  server.use(
    http.get(`${API}/blocks`, () => HttpResponse.json([{ round: 6000200 }])),
    http.get(`${API}/accounts/:address`, ({ params }) =>
      params.address === ACCOUNT_ADDRESS
        ? HttpResponse.json({ balance: "5000000000000000000", nonce: 4, isGuarded: false })
        : HttpResponse.json({ balance: "0", nonce: 0, isGuarded: false }),
    ),
    http.get(`${DELEGATION}/accounts/:address/delegations`, ({ params }) =>
      HttpResponse.json(params.address === ACCOUNT_ADDRESS ? [delegation] : []),
    ),
    http.get(`${API}/accounts/:address/tokens/count`, ({ params }) =>
      HttpResponse.json(params.address === ACCOUNT_ADDRESS ? 1 : 0),
    ),
    http.get(`${API}/accounts/:address/tokens`, ({ params }) =>
      HttpResponse.json(
        params.address === ACCOUNT_ADDRESS
          ? [{ identifier: "MEX-455c57", name: "xExchange", balance: "100" }]
          : [],
      ),
    ),
    http.get(`${API}/accounts/:address/transactions/count`, ({ params }) =>
      HttpResponse.json(params.address === ACCOUNT_ADDRESS ? 1 : 0),
    ),
    http.get(`${API}/accounts/:address/transactions`, ({ params, request }) => {
      if (params.address !== ACCOUNT_ADDRESS) return HttpResponse.json([]);
      return HttpResponse.json(
        new URL(request.url).searchParams.has("token") ? [esdtTransaction] : [sendTransaction],
      );
    }),
  );
};

const scan = async (): Promise<Account[]> => {
  const events = await lastValueFrom(
    buildCurrencyBridge(signerContext)
      .scanAccounts({
        currency: getCryptoCurrencyById("elrond"),
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
  useMswServer();

  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async (_address, _currencyId, identifier) =>
        identifier === "MEX-455c57" ? MEX_TOKEN : undefined,
      findTokenById: async id => (id === MEX_TOKEN.id ? MEX_TOKEN : undefined),
      getTokensSyncHash: async () => "0",
    });
  });

  beforeEach(serveChain);

  it("discovers the funded account then one empty account with the multiversx account shape", async () => {
    const accounts = await scan();

    expect(accounts).toMatchObject([
      {
        id: `js:2:elrond:${ACCOUNT_ADDRESS}:`,
        index: 0,
        derivationMode: "",
        seedIdentifier: PUBLIC_KEYS[ACCOUNT_ADDRESS],
        freshAddress: ACCOUNT_ADDRESS,
        freshAddressPath: "44'/508'/0'/0/0",
        used: true,
        blockHeight: 6000200,
        operationsCount: 1,
        multiversxResources: { nonce: 4, isGuarded: false, delegations: [delegation] },
      },
      {
        id: `js:2:elrond:${OTHER_ADDRESS}:`,
        index: 1,
        derivationMode: "",
        freshAddress: OTHER_ADDRESS,
        freshAddressPath: "44'/508'/1'/0/0",
        used: false,
        operationsCount: 0,
        multiversxResources: { nonce: 0, isGuarded: false, delegations: [] },
      },
    ]);
  });

  it("adds the delegated stake to the balance and keeps it out of the spendable balance", async () => {
    const [funded, empty] = await scan();

    expect({
      funded: [funded.balance.toString(), funded.spendableBalance.toString()],
      empty: [empty.balance.toString(), empty.spendableBalance.toString()],
    }).toEqual({
      funded: ["7000000000000000000", "5000000000000000000"],
      empty: ["0", "0"],
    });
  });

  it("builds the ESDT token sub account of the funded account with its operation", async () => {
    const [funded, empty] = await scan();

    expect(funded.subAccounts).toMatchObject([
      {
        type: "TokenAccount",
        parentId: `js:2:elrond:${ACCOUNT_ADDRESS}:`,
        token: { id: MEX_TOKEN.id },
        operationsCount: 1,
        operations: [{ hash: "hash-esdt", type: "IN", blockHeight: 6000050 }],
      },
    ]);
    expect({
      balance: funded.subAccounts?.[0].balance.toString(),
      emptySubAccounts: empty.subAccounts,
    }).toEqual({ balance: "100", emptySubAccounts: [] });
  });

  it("converts the fetched transaction of the funded account into an OUT operation", async () => {
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
        sequence: op.transactionSequenceNumber?.toString(),
      })),
    ).toEqual([
      {
        hash: "hash-send",
        type: "OUT",
        value: "1000050000000000000",
        fee: "50000000000000",
        blockHeight: 6000100,
        senders: [ACCOUNT_ADDRESS],
        recipients: [OTHER_ADDRESS],
        sequence: "3",
      },
    ]);
  });
});

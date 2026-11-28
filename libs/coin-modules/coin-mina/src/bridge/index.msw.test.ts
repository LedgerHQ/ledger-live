import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { lastValueFrom, toArray } from "rxjs";
import {
  makeAccountBalanceResponse,
  makeBlockInfoResponse,
  makeDelegateAccountResponse,
  makeEpochInfoResponse,
  makeNetworkStatusResponse,
  makeRosettaTransaction,
  makeTransactionsResponse,
  makeValidatorFromAPI,
  makeValidatorsPageResponse,
} from "../test/helpers/msw-fixtures";
import {
  graphqlHandler,
  rosettaHandlers,
  server,
  validatorsHandler,
} from "../test/helpers/msw-rosetta.mock";
import type { MinaSigner } from "../types/signer";
import { buildCurrencyBridge } from "./index";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const FUNDED_ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";
const EMPTY_ADDRESS = "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";

const signer: MinaSigner = {
  getAddress: jest.fn(async (account?: number) => ({
    returnCode: "9000",
    publicKey: account === 1 ? EMPTY_ADDRESS : FUNDED_ADDRESS,
  })),
  signTransaction: jest.fn(),
};

const signerContext = ((_deviceId: string, fn: (signer: MinaSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<MinaSigner>;

const addressOf = (body: unknown) =>
  (body as { account_identifier: { address: string } }).account_identifier.address;

describe("currencyBridge.scanAccounts via MSW", () => {
  it("discovers the funded account then one empty account with the mina account shape", async () => {
    server.use(
      ...rosettaHandlers({
        "/network/status": () => makeNetworkStatusResponse(),
        "/account/balance": body => {
          if (addressOf(body) !== FUNDED_ADDRESS) {
            throw new Error("account not found");
          }
          return makeAccountBalanceResponse({ totalBalance: 5_000_000_000 });
        },
        "/search/transactions": body =>
          makeTransactionsResponse(
            addressOf(body) === FUNDED_ADDRESS
              ? [
                  makeRosettaTransaction({
                    hash: "txn-in",
                    fromAddress: EMPTY_ADDRESS,
                    toAddress: FUNDED_ADDRESS,
                    timestamp: 1700000000000,
                  }),
                ]
              : [],
          ),
        "/block": () => makeBlockInfoResponse(100, { timestamp: 1700000000000 }),
      }),
      graphqlHandler(body => {
        const { query } = body as { query: string };
        return query.includes("daemonStatus")
          ? makeEpochInfoResponse()
          : makeDelegateAccountResponse(null);
      }),
      validatorsHandler(() => makeValidatorsPageResponse([makeValidatorFromAPI()], true)),
    );

    const events = await lastValueFrom(
      buildCurrencyBridge(signerContext)
        .scanAccounts({
          currency: getCryptoCurrencyById("mina"),
          deviceId: "device",
          syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
        })
        .pipe(toArray()),
    );

    const accounts = events
      .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
        return event.type === "discovered";
      })
      .map(event => event.account);

    expect(accounts.map((account: Account) => account.id)).toEqual([
      `js:2:mina:${FUNDED_ADDRESS}:minabip44`,
      `js:2:mina:${EMPTY_ADDRESS}:minabip44`,
    ]);
    expect(accounts).toMatchObject([
      {
        index: 0,
        derivationMode: "minabip44",
        seedIdentifier: FUNDED_ADDRESS,
        freshAddress: FUNDED_ADDRESS,
        freshAddressPath: "44'/12586'/0'/0/0",
        used: true,
        operationsCount: 1,
      },
      {
        index: 1,
        derivationMode: "minabip44",
        seedIdentifier: FUNDED_ADDRESS,
        freshAddress: EMPTY_ADDRESS,
        freshAddressPath: "44'/12586'/1'/0/0",
        used: false,
        operationsCount: 0,
      },
    ]);
    expect(accounts[0].balance.toString()).toBe("5000000000");
    expect(accounts[1].balance.toString()).toBe("0");
  });
});

import { http, HttpResponse } from "msw";
import type { SignedOperation } from "@ledgerhq/types-live";
import {
  getAccount,
  getProviders,
  getEGLDOperations,
  getESDTOperations,
  getAccountESDTTokens,
  getAccountDelegations,
  hasESDTTokens,
  getFees,
  broadcastTransaction,
} from "./sdk";
import type { Transaction } from "../types";
import { server, useMswServer } from "../logic/tests/msw";

// sdk.ts binds its network client to the env-default endpoints at import time.
const API = "https://elrond.coin.ledger.com";
const DELEGATION = "https://delegations-elrond.coin.ledger.com";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const RECIPIENT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

const sendTx = {
  txHash: "h-send",
  sender: ADDR,
  receiver: RECIPIENT,
  value: "1000000000000000000",
  fee: "50000000000000",
  round: 100,
  timestamp: 1700000000,
  miniBlockHash: "mb1",
  nonce: 3,
  status: "success",
};

describe("network/sdk (msw)", () => {
  useMswServer();

  it("getAccount returns balance, nonce and block height", async () => {
    server.use(
      http.get(`${API}/accounts/:addr`, () =>
        HttpResponse.json({ balance: "1000000000000000000", nonce: 7, isGuarded: false }),
      ),
      http.get(`${API}/blocks`, () => HttpResponse.json([{ round: 555 }])),
    );

    const account = await getAccount(ADDR);

    expect(account.balance.toFixed()).toBe("1000000000000000000");
    expect(account.nonce).toBe(7);
    expect(account.blockHeight).toBe(555);
  });

  it("getProviders returns the provider list", async () => {
    server.use(
      http.get(`${DELEGATION}/providers`, () =>
        HttpResponse.json([{ contract: "erd1p", serviceFee: "10" }]),
      ),
    );
    const providers = await getProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0].contract).toBe("erd1p");
  });

  it("getEGLDOperations maps a native send transaction to an OUT operation", async () => {
    server.use(
      http.get(`${API}/accounts/:addr/transactions/count`, () => HttpResponse.json(1)),
      http.get(`${API}/accounts/:addr/transactions`, () => HttpResponse.json([sendTx])),
    );

    const ops = await getEGLDOperations("accId", ADDR, 0, []);

    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("OUT");
    expect(ops[0].hash).toBe("h-send");
    // OUT value = amount + fee (legacy bridge convention): 1e18 + 5e13
    expect(ops[0].value.toFixed()).toBe("1000050000000000000");
  });

  it("getEGLDOperations maps a delegate (staking) transaction", async () => {
    const delegateTx = {
      ...sendTx,
      txHash: "h-deleg",
      receiver: RECIPIENT,
      action: { category: "stake", name: "delegate" },
    };
    server.use(
      http.get(`${API}/accounts/:addr/transactions/count`, () => HttpResponse.json(1)),
      http.get(`${API}/accounts/:addr/transactions`, () => HttpResponse.json([delegateTx])),
    );

    const ops = await getEGLDOperations("accId", ADDR, 0, []);
    expect(ops[0].type).toBe("DELEGATE");
  });

  it("getESDTOperations maps a token transfer operation", async () => {
    const esdtTx = {
      ...sendTx,
      txHash: "h-esdt",
      action: {
        name: "transfer",
        arguments: { transfers: [{ token: "USDC-c76f1f", value: "100" }] },
      },
    };
    server.use(
      http.get(`${API}/accounts/:addr/transactions/count`, () => HttpResponse.json(1)),
      http.get(`${API}/accounts/:addr/transactions`, () => HttpResponse.json([esdtTx])),
    );

    const ops = await getESDTOperations("tokAccId", ADDR, "USDC-c76f1f", 0);
    expect(ops).toHaveLength(1);
    expect(ops[0].value.toFixed()).toBe("100");
  });

  it("getAccountESDTTokens returns the token list", async () => {
    server.use(
      http.get(`${API}/accounts/:addr/tokens/count`, () => HttpResponse.json(1)),
      http.get(`${API}/accounts/:addr/tokens`, () =>
        HttpResponse.json([{ identifier: "USDC-c76f1f", balance: "42" }]),
      ),
    );
    const tokens = await getAccountESDTTokens(ADDR);
    expect(tokens).toEqual([{ identifier: "USDC-c76f1f", balance: "42" }]);
  });

  it("getAccountDelegations returns delegations", async () => {
    server.use(
      http.get(`${DELEGATION}/accounts/:addr/delegations`, () =>
        HttpResponse.json([{ contract: "erd1c", userActiveStake: "1", claimableRewards: "0" }]),
      ),
    );
    const delegations = await getAccountDelegations(ADDR);
    expect(delegations).toHaveLength(1);
  });

  it("hasESDTTokens reflects the token count", async () => {
    server.use(http.get(`${API}/accounts/:addr/tokens/count`, () => HttpResponse.json(3)));
    expect(await hasESDTTokens(ADDR)).toBe(true);

    server.use(http.get(`${API}/accounts/:addr/tokens/count`, () => HttpResponse.json(0)));
    expect(await hasESDTTokens(ADDR)).toBe(false);
  });

  it("broadcastTransaction posts the signed operation and returns the hash", async () => {
    server.use(
      http.post(`${API}/transaction/send`, () =>
        HttpResponse.json({ data: { txHash: "broadcasted" } }),
      ),
    );
    const signedOperation = {
      rawData: { nonce: 1 },
      signature: "aabb",
    } as unknown as SignedOperation;

    const hash = await broadcastTransaction(signedOperation);
    expect(hash).toBe("broadcasted");
  });

  it("getFees computes a fee from constants (no network)", async () => {
    const tx = { data: "", gasLimit: 50000 } as unknown as Transaction;
    const fees = await getFees(tx);
    expect(fees.gt(0)).toBe(true);
  });
});

import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { LOCAL_NODE_SERVER_URL, setLocalNodeCurrencies } from ".";
import { LOCAL_NODE_CLAIM_AMOUNT, claimLocalNodeFunds, getLocalNodeClaim } from "./faucet";

const account = (currencyId: string) =>
  ({
    type: "Account",
    id: `js:2:${currencyId}:address:`,
    currency: getCryptoCurrencyById(currencyId),
    freshAddress: "address",
  }) as unknown as Account;

const tokenAccount = (parent: Account, token: Partial<TokenAccount["token"]>) =>
  ({ type: "TokenAccount", id: `${parent.id}+token`, parentId: parent.id, token }) as TokenAccount;

const USDT_TRC20 = { tokenType: "trc20", contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" };

describe("getLocalNodeClaim", () => {
  afterEach(() => setLocalNodeCurrencies([]));

  it("claims nothing for a currency on its default network", () => {
    expect(getLocalNodeClaim(account("base"))).toBeUndefined();
  });

  it("claims the native coin of a local account", () => {
    setLocalNodeCurrencies(["base", "ripple"]);

    expect(getLocalNodeClaim(account("base"))).toEqual({
      family: "evm",
      network: "base",
      address: "address",
    });
    expect(getLocalNodeClaim(account("ripple"))).toEqual({
      family: "xrp",
      network: "ripple",
      address: "address",
    });
  });

  it("claims an EVM token by contract, to the parent account's address", () => {
    setLocalNodeCurrencies(["base"]);
    const parent = account("base");
    const usdc = tokenAccount(parent, {
      tokenType: "erc20",
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });

    expect(getLocalNodeClaim(usdc, parent)).toEqual({
      family: "evm",
      network: "base",
      address: "address",
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });
  });

  it("claims an SPL token by mint", () => {
    setLocalNodeCurrencies(["solana"]);
    const parent = account("solana");
    const usdc = tokenAccount(parent, {
      tokenType: "spl",
      contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });

    expect(getLocalNodeClaim(usdc, parent)).toEqual({
      family: "solana",
      network: "solana",
      address: "address",
      contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });
  });

  it("claims a TRC20 by contract, and no other Tron token", () => {
    setLocalNodeCurrencies(["tron"]);
    const parent = account("tron");

    expect(getLocalNodeClaim(tokenAccount(parent, USDT_TRC20), parent)).toEqual({
      family: "tron",
      network: "tron",
      address: "address",
      contractAddress: USDT_TRC20.contractAddress,
    });
    expect(
      getLocalNodeClaim(
        tokenAccount(parent, { tokenType: "trc10", contractAddress: "1002000" }),
        parent,
      ),
    ).toBeUndefined();
  });
});

describe("claimLocalNodeFunds", () => {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("posts the claim to the family's airdrop route and returns the transaction hash", async () => {
    let received: unknown;
    server.use(
      http.post(`${LOCAL_NODE_SERVER_URL}/tron/airdrop`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true, txHash: "hash" });
      }),
    );

    await expect(
      claimLocalNodeFunds({
        family: "tron",
        network: "tron",
        address: "address",
        contractAddress: USDT_TRC20.contractAddress,
      }),
    ).resolves.toBe("hash");
    expect(received).toEqual({
      network: "tron",
      address: "address",
      contractAddress: USDT_TRC20.contractAddress,
      amount: LOCAL_NODE_CLAIM_AMOUNT,
    });
  });

  it("surfaces the airdrop server's error", async () => {
    server.use(
      http.post(`${LOCAL_NODE_SERVER_URL}/xrp/airdrop`, () =>
        HttpResponse.json({ error: "ripple is not running" }, { status: 500 }),
      ),
    );

    await expect(
      claimLocalNodeFunds({ family: "xrp", network: "ripple", address: "address" }),
    ).rejects.toThrow("ripple is not running");
  });
});

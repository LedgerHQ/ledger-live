import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { setLocalNodeCurrencies } from ".";
import { LOCAL_NODE_TOKENS } from "./tokens";
import {
  LOCAL_NODE_CLAIM_AMOUNT,
  LOCAL_NODE_FAUCET_URL,
  claimLocalNodeFunds,
  getLocalNodeClaim,
} from "./faucet";

const account = (currencyId: string) =>
  ({
    type: "Account",
    id: `js:2:${currencyId}:address:`,
    currency: getCryptoCurrencyById(currencyId),
    freshAddress: "address",
  }) as unknown as Account;

const tokenAccount = (parent: Account, token: TokenAccount["token"]) =>
  ({ type: "TokenAccount", id: `${parent.id}+token`, parentId: parent.id, token }) as TokenAccount;

const [LOCAL_USDC] = LOCAL_NODE_TOKENS.stellar;

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
      ...LOCAL_USDC,
      parentCurrencyId: parent.currency.id,
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });

    expect(getLocalNodeClaim(usdc, parent)).toEqual({
      family: "evm",
      network: "base",
      address: "address",
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    });
  });

  it("claims only the local issuer's Stellar tokens", () => {
    setLocalNodeCurrencies(["stellar"]);
    const parent = account("stellar");

    expect(getLocalNodeClaim(tokenAccount(parent, LOCAL_USDC), parent)).toEqual({
      family: "stellar",
      network: "stellar",
      address: "address",
      assetCode: "USDC",
    });
    expect(
      getLocalNodeClaim(
        tokenAccount(parent, { ...LOCAL_USDC, id: LOCAL_USDC.id.replace("GB6", "GA5") as never }),
        parent,
      ),
    ).toBeUndefined();
  });

  it("claims a TRC10 by asset id and a TRC20 by contract", () => {
    setLocalNodeCurrencies(["tron"]);
    const parent = account("tron");
    const trc10 = { ...LOCAL_USDC, id: "tron/trc10/1000001", tokenType: "trc10" };
    const trc20 = {
      ...LOCAL_USDC,
      id: "tron/trc20/tgj3d5xvexcdrdcdf2cpqxnourm1fzfoxs",
      tokenType: "trc20",
      contractAddress: "TGJ3D5XVeXcdrdCdF2cpqXNoURm1FZfoXs",
    };

    expect(getLocalNodeClaim(tokenAccount(parent, trc10 as never), parent)).toMatchObject({
      family: "tron",
      tokenId: "1000001",
    });
    expect(getLocalNodeClaim(tokenAccount(parent, trc20 as never), parent)).toMatchObject({
      family: "tron",
      contractAddress: "TGJ3D5XVeXcdrdCdF2cpqXNoURm1FZfoXs",
    });
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
      http.post(`${LOCAL_NODE_FAUCET_URL}/stellar/airdrop`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ ok: true, txHash: "0xhash" });
      }),
    );

    await expect(
      claimLocalNodeFunds({
        family: "stellar",
        network: "stellar",
        address: "address",
        assetCode: "USDC",
      }),
    ).resolves.toBe("0xhash");
    expect(received).toEqual({
      network: "stellar",
      address: "address",
      assetCode: "USDC",
      amount: LOCAL_NODE_CLAIM_AMOUNT,
    });
  });

  it("surfaces the airdrop server's error", async () => {
    server.use(
      http.post(`${LOCAL_NODE_FAUCET_URL}/stellar/airdrop`, () =>
        HttpResponse.json({ error: "no trustline" }, { status: 500 }),
      ),
    );

    await expect(
      claimLocalNodeFunds({ family: "stellar", network: "stellar", address: "address" }),
    ).rejects.toThrow("no trustline");
  });
});

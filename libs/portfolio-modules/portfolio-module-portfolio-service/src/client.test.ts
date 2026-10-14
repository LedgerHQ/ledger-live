import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type { PortfolioApi, TransactionIntentView } from "@ledgerhq/portfolio-module-framework";
import { createPortfolioServiceClient } from "./client";

const BASE_URL = "https://portfolio.example";
const ANSWER = { answered: true };

function setup(answer: () => Response = () => Response.json(ANSWER)) {
  const fetch = jest.fn<Promise<Response>, Parameters<typeof globalThis.fetch>>(async () =>
    answer(),
  );
  const client = createPortfolioServiceClient({
    baseUrl: BASE_URL,
    fetch,
    headers: { authorization: "Bearer jwt" },
  });
  const sent = () => {
    const [url, init] = fetch.mock.calls[0] ?? [];
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    return { url, method: init?.method, headers: new Headers(init?.headers), body };
  };
  return { client, sent };
}

const intent: TransactionIntentView = {
  type: "send",
  sender: "bc1qsender",
  recipient: "bc1qrecipient",
  amount: "1000",
  feesStrategy: "medium",
};

type Case = {
  operation: keyof PortfolioApi;
  call: (client: PortfolioApi) => Promise<unknown>;
  method: string;
  path: string;
  body?: unknown;
};

const cases: Case[] = [
  {
    operation: "getPortfolio",
    call: client => client.getPortfolio("p1"),
    method: "GET",
    path: "/v1/portfolio/p1",
  },
  {
    operation: "createPortfolio",
    call: client => client.createPortfolio("p1"),
    method: "PUT",
    path: "/v1/portfolio/p1",
  },
  {
    operation: "addRegistrations",
    call: client =>
      client.addRegistrations("p1", [
        { type: "auto_derive", network: "bitcoin", xpub: "xpub6" },
        { type: "evm", address: "0xabc" },
      ]),
    method: "POST",
    path: "/v1/portfolio/p1/registrations",
    body: [
      { type: "auto_derive", network: "bitcoin", xpub: "xpub6" },
      { type: "evm", address: "0xabc" },
    ],
  },
  {
    operation: "removeRegistrations",
    call: client => client.removeRegistrations("p1", ["r1", "r2"]),
    method: "DELETE",
    path: "/v1/portfolio/p1/registrations",
    body: ["r1", "r2"],
  },
  {
    operation: "addAddresses",
    call: client => client.addAddresses("p1", "a1", { type: "static", addresses: ["addr1"] }),
    method: "POST",
    path: "/v1/portfolio/p1/accounts/a1/addresses",
    body: { type: "static", addresses: ["addr1"] },
  },
  {
    operation: "getUpdates",
    call: client => client.getUpdates("p1"),
    method: "GET",
    path: "/v1/portfolio/p1/updates",
  },
  {
    operation: "getPortfolioBalance",
    call: client => client.getPortfolioBalance("p1"),
    method: "GET",
    path: "/v1/portfolio/p1/balance",
  },
  {
    operation: "getPortfolioBalanceHistory",
    call: client => client.getPortfolioBalanceHistory("p1"),
    method: "GET",
    path: "/v1/portfolio/p1/balance/history",
  },
  {
    operation: "listNetworks",
    call: client => client.listNetworks(),
    method: "GET",
    path: "/v1/networks",
  },
  {
    operation: "getLastBlock",
    call: client => client.getLastBlock("bitcoin"),
    method: "GET",
    path: "/v1/bitcoin/last-block",
  },
  {
    operation: "getValidators",
    call: client => client.getValidators("solana"),
    method: "GET",
    path: "/v1/solana/validators",
  },
  {
    operation: "validateAddress",
    call: client => client.validateAddress("bitcoin", "bc1qaddress"),
    method: "GET",
    path: "/v1/bitcoin/validate-address?address=bc1qaddress",
  },
  {
    operation: "getNextSequence",
    call: client => client.getNextSequence("ethereum", "0xabc"),
    method: "GET",
    path: "/v1/ethereum/account/0xabc/next-sequence",
  },
  {
    operation: "estimateTransactionFee",
    call: client => client.estimateTransactionFee("bitcoin", { intent }),
    method: "POST",
    path: "/v1/bitcoin/transaction/estimate",
    body: { intent },
  },
  {
    operation: "encodeTransaction",
    call: client => client.encodeTransaction("bitcoin", { intent, customFees: "250" }),
    method: "POST",
    path: "/v1/bitcoin/transaction/encode",
    body: { intent, customFees: "250" },
  },
  {
    operation: "combineTransaction",
    call: client =>
      client.combineTransaction("bitcoin", { rawTransaction: "0xraw", signature: "0xsig" }),
    method: "POST",
    path: "/v1/bitcoin/transaction/combine",
    body: { rawTransaction: "0xraw", signature: "0xsig" },
  },
  {
    operation: "broadcastTransaction",
    call: client => client.broadcastTransaction("bitcoin", { signedTransaction: "0xsigned" }),
    method: "POST",
    path: "/v1/bitcoin/transaction/broadcast",
    body: { signedTransaction: "0xsigned" },
  },
];

describe("createPortfolioServiceClient", () => {
  it.each(cases)("$operation sends $method $path", async ({ call, method, path, body }) => {
    const { client, sent } = setup();

    const answer = await call(client);

    expect(answer).toEqual(ANSWER);
    expect(sent()).toMatchObject({ url: `${BASE_URL}${path}`, method, body });
    expect(sent().headers.get("authorization")).toBe("Bearer jwt");
  });

  it("serves every operation of the portfolio API", () => {
    const { client } = setup();

    expect(Object.keys(client).sort()).toEqual(cases.map(({ operation }) => operation).sort());
  });

  it("URL-encodes the path segments", async () => {
    const { client, sent } = setup();

    await client.addAddresses("my/portfolio", "account #1", { type: "static" });

    expect(sent().url).toBe(
      `${BASE_URL}/v1/portfolio/my%2Fportfolio/accounts/account%20%231/addresses`,
    );
  });

  it("sends the query of the updates", async () => {
    const { client, sent } = setup();

    await client.getUpdates("p1", {
      size: 10,
      order: "ASC",
      token: "next",
      network: "bitcoin",
      account: "a1",
      asset: "native",
      address: "bc1qaddress",
    });

    expect(sent().url).toBe(
      `${BASE_URL}/v1/portfolio/p1/updates?size=10&order=ASC&token=next&network=bitcoin&account=a1&asset=native&address=bc1qaddress`,
    );
  });

  it("sends the query of the balance", async () => {
    const { client, sent } = setup();

    await client.getPortfolioBalance("p1", {
      size: 20,
      order: "DESC",
      token: "next",
      network: "ethereum",
      account: "a1",
      asset: "0xusdc",
      currency: "eur",
    });

    expect(sent().url).toBe(
      `${BASE_URL}/v1/portfolio/p1/balance?size=20&order=DESC&token=next&network=ethereum&account=a1&asset=0xusdc&currency=eur`,
    );
  });

  it("sends the query of the balance history", async () => {
    const { client, sent } = setup();

    await client.getPortfolioBalanceHistory("p1", {
      size: 50,
      order: "ASC",
      token: "next",
      range: "week",
      currency: "usd",
      network: "bitcoin",
      account: "a1",
      asset: "native",
    });

    expect(sent().url).toBe(
      `${BASE_URL}/v1/portfolio/p1/balance/history?size=50&order=ASC&token=next&range=week&currency=usd&network=bitcoin&account=a1&asset=native`,
    );
  });

  it("sends only the defined parameters of a query", async () => {
    const { client, sent } = setup();

    await client.getPortfolioBalance("p1", { currency: "eur" });

    expect(sent().url).toBe(`${BASE_URL}/v1/portfolio/p1/balance?currency=eur`);
  });

  it("sends the cursor of the validators", async () => {
    const { client, sent } = setup();

    await client.getValidators("solana", { cursor: "page 2" });

    expect(sent().url).toBe(`${BASE_URL}/v1/solana/validators?cursor=page+2`);
  });

  it("rejects with the PortfolioApiError of the service", async () => {
    const { client } = setup(() =>
      Response.json(
        { status: 400, type: "BAD_REQUEST", message: "Request is not valid" },
        { status: 400 },
      ),
    );

    const error = await client.createPortfolio("p1").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PortfolioApiError);
    expect(error).toMatchObject({
      type: "BAD_REQUEST",
      status: 400,
      message: "Request is not valid",
    });
  });
});

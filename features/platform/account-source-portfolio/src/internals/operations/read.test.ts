import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import {
  DOT,
  ETH,
  PORTFOLIO_ID,
  POLYGON,
  fakeService,
  serverAccountId,
  update,
} from "../fakeService.mock";
import { limitOf, readUpdates, serviceAssetOf } from "./read";

const USD = FiatCurrencyTickerSchema.parse("USD");
const USDT = mockTokenCurrency();
const asset = (id: string) => CryptoOrTokenCurrencyIdSchema.parse(id);

describe("limitOf", () => {
  it.each([
    [undefined, 20],
    [{}, 20],
    [{ limit: 5 }, 5],
    [{ limit: 0 }, 20],
    [{ limit: 2.5 }, 20],
  ])("reads %j as %i", (query, limit) => {
    expect(limitOf(query)).toBe(limit);
  });
});

describe("serviceAssetOf", () => {
  const { client } = fakeService({ tokens: [USDT] });

  it("asks for every update without a filter, or with the account's coin", async () => {
    await expect(serviceAssetOf(client, ETH, undefined)).resolves.toEqual({});
    await expect(serviceAssetOf(client, ETH, asset("ethereum"))).resolves.toEqual({});
    expect(client.findToken).not.toHaveBeenCalled();
  });

  it("asks for a token by its standard and lowercase contract", async () => {
    await expect(serviceAssetOf(client, ETH, asset(USDT.id))).resolves.toEqual({
      asset: "erc20.0xdac17f958d2ee523a2206206994597c13d831ec7",
    });
  });

  it("matches nothing for a token CAL does not list or of another network", async () => {
    await expect(serviceAssetOf(client, ETH, asset("ethereum/erc20/unknown"))).resolves.toBe(
      undefined,
    );
    await expect(serviceAssetOf(client, POLYGON, asset(USDT.id))).resolves.toBe(undefined);
  });

  it("keeps a token filter local outside EVM, where the service's asset cannot be spelled", async () => {
    const { client: own } = fakeService({ tokens: [USDT] });
    await expect(
      serviceAssetOf(own, DOT, asset("tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t")),
    ).resolves.toEqual({});
    expect(own.findToken).not.toHaveBeenCalled();
  });
});

describe("readUpdates", () => {
  it("reads one page of the account, forwarding the limit and the cursor as page token", async () => {
    const { client } = fakeService({
      updates: [update(ETH, { tx: { hash: "0x1" } }), update(ETH, { tx: { hash: "0x2" } })],
    });

    const page = await readUpdates(client, PORTFOLIO_ID(), serverAccountId(ETH), {
      limit: 1,
      cursor: "1",
    });

    expect(client.getUpdates.mock.calls.map(([, params]) => params)).toEqual([
      { account: serverAccountId(ETH), size: 1, token: "1" },
    ]);
    expect(page.items.map(item => item.tx.hash)).toEqual(["0x2"]);
  });

  it("forwards the service asset and the fiat as currency", async () => {
    const { client } = fakeService();

    await readUpdates(client, PORTFOLIO_ID(), serverAccountId(ETH), {
      limit: 5,
      asset: "erc20.0xabc",
      fiat: { ticker: USD, currency: "USD", magnitude: 2 },
    });

    expect(client.getUpdates).toHaveBeenCalledWith(
      expect.anything(),
      {
        account: serverAccountId(ETH),
        size: 5,
        token: undefined,
        asset: "erc20.0xabc",
        currency: "USD",
      },
      undefined,
    );
  });
});

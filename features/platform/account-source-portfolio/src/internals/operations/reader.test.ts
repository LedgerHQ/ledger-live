import type { AccountTarget } from "@domain/api-account-data";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { AccountOperationsQuery } from "@domain/entity-account-operation";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  ETH,
  depsOf,
  evm,
  fakeService,
  reasonOf,
  serviceAccount,
  synced,
  targetOf,
  update,
  DOT,
} from "../fakeService.mock";
import { PortfolioReadError } from "../readiness";
import { operationsReader } from "./reader";

const hashes = (count: number) =>
  Array.from({ length: count }, (_, index) => update(ETH, { tx: { hash: `0x${index}` } }));

function setup(service = fakeService()) {
  const deps = depsOf(service.client);
  const read = (targets: AccountTarget[], limit?: number) =>
    operationsReader(deps)(targets, limit === undefined ? undefined : { limit });
  return { ...service, deps, read };
}

const USDT = mockTokenCurrency();
const USDT_ASSET = "erc20.0xdac17f958d2ee523a2206206994597c13d831ec7";

const tokenSend = update(ETH, {
  tx: { hash: "0xsend" },
  deltas: [
    { asset: "native", amount: "-1", currency_value: -0.5 },
    { asset: USDT_ASSET, cal_id: USDT.id, amount: "-3", currency_value: -3 },
  ],
});
const receive = update(ETH, {
  tx: { hash: "0xreceive" },
  deltas: [{ asset: "native", amount: "10", currency_value: 12.345 }],
});
const queryService = () =>
  fakeService({ portfolio: synced([ETH]), updates: [tokenSend, receive], tokens: [USDT] });
const readWith = (query: AccountOperationsQuery, svc = queryService()) =>
  operationsReader(depsOf(svc.client))([targetOf(ETH)], query).then(([settled]) => ({
    settled,
    client: svc.client,
  }));

describe("operationsReader", () => {
  it("serves a page of limit updates and the next one from its cursor", async () => {
    const { read, deps } = setup(fakeService({ portfolio: synced([ETH]), updates: hashes(3) }));

    const [first] = await read([targetOf(ETH)], 2);
    expect(first).toMatchObject({
      status: "fulfilled",
      value: { operations: [{ hash: "0x0" }, { hash: "0x1" }], nextCursor: "2" },
    });

    const [second] = await read([{ ...targetOf(ETH), cursor: "2" }], 2);
    expect(second).toEqual({
      status: "fulfilled",
      value: { operations: [expect.objectContaining({ hash: "0x2" })] },
    });
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: true,
      summary: "Operations of 1 accounts in 1 calls: 1 served",
    });
    expect(deps.store.get()).toMatchObject({ busy: false });
  });

  it("reads 20 updates by default", async () => {
    const { read, client } = setup(fakeService({ portfolio: synced([ETH]), updates: hashes(1) }));
    await read([targetOf(ETH)]);
    expect(client.getUpdates).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ size: 20 }),
    );
  });

  it("registers, waits, then fails the accounts the service never gets ready", async () => {
    const utxo = DOT;
    const { read, client } = setup(
      fakeService({ portfolio: synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }) }),
    );

    const settled = await read([
      targetOf(ETH),
      targetOf(evm(2)),
      { accountUUID: computeAccountUUID(utxo), descriptor: utxo },
    ]);

    expect(client.addRegistrations).toHaveBeenCalledTimes(1);
    expect(client.getPortfolio).toHaveBeenCalledTimes(41);
    expect(client.getUpdates).not.toHaveBeenCalled();
    expect(settled.map(each => String(reasonOf(each)))).toEqual([
      expect.stringContaining("Service account uninitialized"),
      expect.stringContaining("Service account not created yet"),
      expect.stringContaining("Not an account the Portfolio service serves"),
    ]);
  });

  it("fails only the account whose call failed, keeping the body out", async () => {
    const service = fakeService({ portfolio: synced([ETH, evm(2)]), updates: hashes(1) });
    service.client.getUpdates.mockImplementation(async (_id, { account }) => {
      if (account.endsWith(evm(2).address)) throw new Error(`500 for ${evm(2).address}`);
      return { items: hashes(1), nextToken: undefined };
    });
    const { read } = setup(service);

    const [eth, failed] = await read([targetOf(ETH), targetOf(evm(2))]);

    expect(eth.status).toBe("fulfilled");
    expect(reasonOf(failed)).toBeInstanceOf(PortfolioReadError);
    expect(String(reasonOf(failed))).toContain("Unexpected error");
    expect(String(reasonOf(failed))).not.toContain(evm(2).address);
  });

  it("serves no account when listing the portfolio fails", async () => {
    const service = fakeService();
    service.client.getPortfolio.mockRejectedValue(new Error("boom"));
    const { read, deps } = setup(service);

    const settled = await read([targetOf(ETH)]);

    expect(reasonOf(settled[0])).toBeInstanceOf(PortfolioReadError);
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: false,
      summary: "Operations read failed: Unexpected error",
    });
  });

  describe("with a query", () => {
    it("asks the service for a token's updates and serves only its rows", async () => {
      const { settled, client } = await readWith({
        filterAsset: CryptoOrTokenCurrencyIdSchema.parse(USDT.id),
      });

      expect(client.getUpdates).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ asset: USDT_ASSET }),
      );
      expect(settled).toMatchObject({
        status: "fulfilled",
        value: { operations: [{ hash: "0xsend", assetId: USDT.id }] },
      });
      expect(settled.status === "fulfilled" && settled.value.operations).toHaveLength(1);
    });

    it("filters the coin locally, keeping the fee of a token send", async () => {
      const { settled, client } = await readWith({
        filterAsset: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
      });

      expect(client.getUpdates.mock.calls[0]?.[1]).not.toHaveProperty("asset");
      expect(
        settled.status === "fulfilled" && settled.value.operations.map(row => row.type),
      ).toEqual(["FEES", "IN"]);
    });

    it("serves no row, without a call, for a token the account cannot hold", async () => {
      const { settled, client } = await readWith({
        filterAsset: CryptoOrTokenCurrencyIdSchema.parse("polygon/erc20/unknown"),
      });

      expect(client.getUpdates).not.toHaveBeenCalled();
      expect(settled).toEqual({ status: "fulfilled", value: { operations: [] } });
    });

    it("fails the account when the token lookup fails", async () => {
      const svc = queryService();
      svc.client.findToken.mockRejectedValue(new Error("CAL down"));

      const { settled } = await readWith(
        { filterAsset: CryptoOrTokenCurrencyIdSchema.parse(USDT.id) },
        svc,
      );

      expect(reasonOf(settled)).toBeInstanceOf(PortfolioReadError);
    });

    it("values the rows in the fiat the service is asked for", async () => {
      const { settled, client } = await readWith({
        countervalue: FiatCurrencyTickerSchema.parse("EUR"),
      });

      expect(client.getUpdates).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ currency: "EUR" }),
      );
      expect(
        settled.status === "fulfilled" &&
          settled.value.operations.map(row => [row.type, row.countervalues]),
      ).toEqual([
        ["FEES", { EUR: "50" }],
        ["OUT", { EUR: "300" }],
        ["IN", { EUR: "1235" }],
      ]);
    });
  });
});

import { toJsonOperation } from "@ledgerhq/account-module-framework";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { aFailedAccount, aStoredAccount, aStoredPortfolio, someDeps } from "./test-utils";
import { getUpdates } from "./updates";

const at = (day: number) => new Date(Date.UTC(2026, 0, day));

const received = anOperation({
  id: "received",
  hash: "tx-received",
  senders: ["alice"],
  recipients: ["bob"],
  date: at(1),
});
const sent = anOperation({ id: "sent", type: "OUT", recipients: ["carol"], date: at(3) });
const token = anOperation({
  id: "token",
  asset: { type: "erc20", assetReference: "0xusdc" },
  date: at(2),
});
const onEthereum = anOperation({ id: "on-ethereum", date: at(2) });

const setUp = async () => {
  const deps = someDeps();
  await deps.store.put(
    aStoredPortfolio({
      accounts: [
        aStoredAccount({ id: "btc" }),
        aStoredAccount({ id: "eth", network: "ethereum" }),
        aFailedAccount({ id: "failed" }),
      ],
    }),
  );
  await deps.store.history("btc").upsert([received, token, sent]);
  await deps.store.history("eth").upsert([onEthereum]);
  await deps.store.history("failed").upsert([anOperation({ id: "not-local" })]);
  return deps;
};

const idsOf = (page: { items?: Array<{ operation: unknown }> }) =>
  page.items?.map(({ operation }) => (operation as { id: string }).id);

describe("getUpdates", () => {
  it("returns the operations of every account served locally, newest first", async () => {
    const page = await getUpdates(await setUp(), "portfolio");

    expect(idsOf(page)).toEqual(["sent", "on-ethereum", "token", "received"]);
    expect(page.items?.at(-1)).toEqual({
      network: "bitcoin",
      accountId: "btc",
      operation: toJsonOperation(received),
      time: "2026-01-01T00:00:00.000Z",
      txHash: "tx-received",
    });
  });

  it("orders oldest first on request, by account then operation on the same date", async () => {
    const deps = await setUp();
    await deps.store.history("btc").upsert([anOperation({ id: "also-on-day-2", date: at(2) })]);

    const page = await getUpdates(deps, "portfolio", { order: "ASC" });

    expect(idsOf(page)).toEqual(["received", "also-on-day-2", "token", "on-ethereum", "sent"]);
  });

  it("filters by network, account, asset and address", async () => {
    const deps = await setUp();

    expect(idsOf(await getUpdates(deps, "portfolio", { network: "ethereum" }))).toEqual([
      "on-ethereum",
    ]);
    expect(idsOf(await getUpdates(deps, "portfolio", { account: "btc" }))).toEqual([
      "sent",
      "token",
      "received",
    ]);
    expect(idsOf(await getUpdates(deps, "portfolio", { asset: "0xusdc" }))).toEqual(["token"]);
    expect(idsOf(await getUpdates(deps, "portfolio", { asset: "native", account: "btc" }))).toEqual(
      ["sent", "received"],
    );
    expect(idsOf(await getUpdates(deps, "portfolio", { address: "alice" }))).toEqual(["received"]);
    expect(idsOf(await getUpdates(deps, "portfolio", { address: "carol" }))).toEqual(["sent"]);
  });

  it("pages 100 updates at a time by default", async () => {
    const deps = someDeps();
    await deps.store.put(aStoredPortfolio());
    await deps.store
      .history("account")
      .upsert(Array.from({ length: 101 }, (_, index) => anOperation({ id: `op-${index}` })));

    const first = await getUpdates(deps, "portfolio");
    const second = await getUpdates(deps, "portfolio", { token: first.nextToken ?? "" });

    expect(first.items).toHaveLength(100);
    expect(first.nextToken).toBe("100");
    expect(second.items).toHaveLength(1);
  });

  it("rejects an unknown portfolio as not found", async () => {
    await expect(getUpdates(someDeps(), "unknown")).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Portfolio unknown not found"),
    );
  });
});

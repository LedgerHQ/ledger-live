import { discoverAccounts, type DiscoveredAccount } from "./discover";
import { createMemoryHistoryStore } from "./history";
import { anOperation, testContext } from "./test-utils";
import type { AccountModuleApi, HistoryStore } from "./types";

const context = testContext();

/** A module whose accounts 0 and 1 have history, account 2 a balance only, the next ones nothing. */
function fakeModule(): AccountModuleApi {
  const used = (key: string) => key === "key-0'" || key === "key-1'";
  return {
    sync: async function* (_context, { descriptor, history }) {
      if (used(descriptor.key)) await history.upsert([anOperation({ id: descriptor.key })]);
      yield { state: { version: 1, data: descriptor.key }, progress: {} };
    },
    getBalances: async (_context, { descriptor }) => [
      { value: descriptor.key === "key-2'" ? 5n : 0n, asset: { type: "native" } },
    ],
  } as Partial<AccountModuleApi> as AccountModuleApi;
}

async function collect(iterable: AsyncIterable<DiscoveredAccount>) {
  const all: DiscoveredAccount[] = [];
  for await (const item of iterable) all.push(item);
  return all;
}

const request = {
  currencyId: "bitcoin",
  derivationMode: "native_segwit",
  derivationScheme: "84'/0'",
  getAccountKey: async (path: string) => `key-${path.split("/")[2]}`,
};

describe("discoverAccounts", () => {
  it("syncs account after account and stops after the first empty one", async () => {
    const found = await collect(discoverAccounts(fakeModule(), context, request));
    expect(found.map(a => [a.descriptor.derivationPath, a.empty])).toEqual([
      ["84'/0'/0'", false],
      ["84'/0'/1'", false],
      ["84'/0'/2'", false],
      ["84'/0'/3'", true],
    ]);
    expect(found[0]).toMatchObject({
      descriptor: {
        currencyId: "bitcoin",
        derivationMode: "native_segwit",
        index: 0,
        key: "key-0'",
      },
      state: { version: 1, data: "key-0'" },
    });
  });

  it("starts where asked, bounds the scan, and writes to the histories the client provides", async () => {
    const histories: HistoryStore[] = [];
    const found = await collect(
      discoverAccounts(fakeModule(), context, {
        ...request,
        startIndex: 1,
        maxAccounts: 1,
        createHistory: () => {
          const history = createMemoryHistoryStore();
          histories.push(history);
          return history;
        },
      }),
    );
    expect(found.map(a => a.descriptor.index)).toEqual([1]);
    expect(found[0]?.history).toBe(histories[0]);
  });

  it("passes the abort signal on and stops once aborted", async () => {
    const controller = new AbortController();
    const module = fakeModule();
    const sync = jest.spyOn(module, "sync");
    const scan = async () => {
      for await (const _ of discoverAccounts(module, context, {
        ...request,
        signal: controller.signal,
      })) {
        controller.abort();
      }
    };
    await expect(scan()).rejects.toThrow("aborted");
    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith(context, expect.anything(), { signal: controller.signal });
  });
});

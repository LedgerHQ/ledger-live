import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { iconDefaults, setCoinConfig } from "../config";
import { listOperations } from "./listOperations";

const ADDRESS = "hxe52720d9125586e64c745bf3c2c1917dbb46f9ba";
const currency = { id: "icon" } as CryptoCurrency;

describe("listOperations (integration)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      ...iconDefaults.icon,
      infra: {
        indexer: "https://icon.coin.ledger.com/api/v1",
        indexer_testnet: "https://tracker.berlin.icon.community/api/v1",
        node_endpoint: "https://icon.coin.ledger.com/api/v3",
        node_testnet_endpoint: "https://berlin.net.solidwallet.io/api/v3",
        debug_endpoint: "https://icon.coin.ledger.com/api/v3d",
        debug_testnet_endpoint: "https://berlin.net.solidwallet.io/api/v3d",
      },
    }));
  });

  it("maps the indexer transactions of the address to core operations", async () => {
    const { items } = await listOperations(currency, ADDRESS, { minHeight: 0 });

    expect(items.length).toBeGreaterThan(0);
    for (const operation of items) {
      expect(operation.type).toBe(operation.senders[0] === ADDRESS ? "OUT" : "IN");
      expect(operation.asset).toEqual({ type: "native" });
      expect(operation.tx.hash).toMatch(/^0x[0-9a-f]{64}$/);
      expect(operation.tx.fees).toBeGreaterThan(0n);
      expect(operation.value).toBeGreaterThanOrEqual(0n);
      expect(operation.tx.block.height).toBeGreaterThan(0);
      expect(operation.tx.date.getTime()).toBeGreaterThan(0);
    }
  });

  it.each([
    {
      hash: "0x634ad2d4b4bda9cc4a2558874725dda7ab69ab1debbaebc29b863fdd07e1d7d8",
      type: "OUT",
      senders: [ADDRESS],
      recipients: ["hx81135b6c6668ec67357ea57a945ae8fe9d681f97"],
      value: 1001047775000000000n,
      fees: 1250000000000000n,
      height: 75138707,
      date: new Date("2023-12-18T04:27:14.206Z"),
    },
    {
      hash: "0xa26378e00d87df2b2755f3fb2bb32d1e7304cddb5b4091a4d1aa7c52eb17f549",
      type: "IN",
      senders: ["hxfaaba80a4d663ecf37597ab4e2edf0cb5db4fe14"],
      recipients: [ADDRESS],
      value: 2000000000000000000n,
      fees: 1250000000000000n,
      height: 54395343,
      date: new Date("2022-08-24T07:36:02.015Z"),
    },
  ])(
    "maps the $type reference transaction $hash with its exact indexer values",
    async ({ hash, type, senders, recipients, value, fees, height, date }) => {
      const { items } = await listOperations(currency, ADDRESS, { minHeight: 0, limit: 100 });

      expect(items.find(operation => operation.tx.hash === hash)).toEqual({
        id: hash,
        type,
        senders,
        recipients,
        value,
        asset: { type: "native" },
        details: { hasValue: true },
        tx: {
          hash,
          block: { height, hash: "", time: date },
          fees,
          date,
          failed: false,
        },
      });
    },
  );

  it("walks to the next page with the returned cursor", async () => {
    const firstPage = await listOperations(currency, ADDRESS, { minHeight: 0, limit: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.next).toBe("2");

    const secondPage = await listOperations(currency, ADDRESS, {
      minHeight: 0,
      limit: 2,
      cursor: firstPage.next,
    });

    expect(secondPage.items.length).toBeGreaterThan(0);
    const firstHashes = firstPage.items.map(operation => operation.tx.hash);
    for (const operation of secondPage.items) {
      expect(firstHashes).not.toContain(operation.tx.hash);
    }
  });
});

import { lastValueFrom, toArray } from "rxjs";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  discoverAccounts,
  type DerivedKey,
  type DeriveRequest,
  type DiscoveryPorts,
} from "./discoverAccounts";

const addressOf = (path: string) => `addr(${path})`;

/** A chain where the accounts at these paths have history. */
function fakePorts(usedPaths: readonly string[], overrides: Partial<DiscoveryPorts> = {}) {
  const used = new Set(usedPaths);
  const requests: DeriveRequest[] = [];
  const ports: DiscoveryPorts = {
    derive: jest.fn(async (request): Promise<DerivedKey> => {
      requests.push(request);
      return request.currencyId === "bitcoin"
        ? { type: "utxo", xpub: `xpub(${request.accountPath})` }
        : { type: "address", address: addressOf(request.path) };
    }),
    exists: jest.fn(async (descriptor: AccountDescriptor) =>
      used.has(descriptor.type === "utxo" ? descriptor.xpub : descriptor.address),
    ),
    ...overrides,
  };
  return { ports, requests };
}

const collect = (ports: DiscoveryPorts, options: Parameters<typeof discoverAccounts>[1]) =>
  lastValueFrom(discoverAccounts(ports, options).pipe(toArray()));

describe("discoverAccounts", () => {
  it("emits the used accounts and the first empty one, then stops at the gap limit", async () => {
    const { ports } = fakePorts([addressOf("44'/60'/0'/0/0"), addressOf("44'/60'/1'/0/0")]);
    const found = await collect(ports, { currencyId: "ethereum", derivationModes: [""] });
    expect(found.map(({ index, used }) => [index, used])).toEqual([
      [0, true],
      [1, true],
      [2, false],
    ]);
    expect(found[0].descriptor).toEqual({
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "ethereum", env: "main" },
      address: addressOf("44'/60'/0'/0/0"),
      path: "m/44h/60h/0h/0/0",
    });
  });

  it("crosses a gap shorter than the mandatory empty account skip", async () => {
    // ethM tolerates 10 empty accounts: the account after a gap of 5 is still found.
    const { ports } = fakePorts([addressOf("44'/60'/0'/0"), addressOf("44'/60'/0'/6")]);
    const found = await collect(ports, { currencyId: "ethereum", derivationModes: ["ethM"] });
    expect(found.filter(account => account.used).map(account => account.index)).toEqual([0, 6]);
  });

  it("scans mandatoryEmptyAccountSkip + 1 empty accounts before stopping", async () => {
    const { ports, requests } = fakePorts([]);
    await collect(ports, { currencyId: "ethereum", derivationModes: ["ethM"] });
    expect(requests).toHaveLength(11);
  });

  it("raises the gap limit with keychainObservableRange", async () => {
    const { ports, requests } = fakePorts([]);
    await collect(ports, {
      currencyId: "ethereum",
      derivationModes: [""],
      keychainObservableRange: 3,
    });
    expect(requests).toHaveLength(4);
  });

  it("offers the first empty account only in a mode that can create one", async () => {
    const { ports } = fakePorts([]);
    // ethM is a legacy mode of ethereum: empty accounts there are not offered.
    expect(await collect(ports, { currencyId: "ethereum", derivationModes: ["ethM"] })).toEqual([]);
    expect(
      (await collect(ports, { currencyId: "ethereum", derivationModes: [""] })).map(a => a.used),
    ).toEqual([false]);
  });

  it("skips the index a mode leaves to another", async () => {
    const { ports, requests } = fakePorts([]);
    await collect(ports, { currencyId: "ethereum", derivationModes: ["ethMM"] });
    expect(requests[0].index).toBe(1);
  });

  it("skips a mode the device does not support, and scans the next", async () => {
    const error = Object.assign(new Error("no"), { name: "UnsupportedDerivation" });
    const { ports, requests } = fakePorts([], {
      derive: jest.fn(async (request: DeriveRequest): Promise<DerivedKey> => {
        if (request.derivationMode === "ethM") throw error;
        return { type: "address", address: addressOf(request.path) };
      }),
    });
    const found = await collect(ports, {
      currencyId: "ethereum",
      derivationModes: ["ethM", ""],
    });
    expect(found.map(a => a.derivationMode)).toEqual([""]);
    expect(requests).toHaveLength(0);
  });

  it("surfaces any other derivation error", async () => {
    const { ports } = fakePorts([], {
      derive: jest.fn(async () => {
        throw new Error("device locked");
      }),
    });
    await expect(collect(ports, { currencyId: "ethereum" })).rejects.toThrow("device locked");
  });

  it("scans a non-iterable mode once", async () => {
    const { ports, requests } = fakePorts([addressOf("44'/501'")]);
    const found = await collect(ports, { currencyId: "solana", derivationModes: ["solanaMain"] });
    expect(requests.map(r => r.path)).toEqual(["44'/501'"]);
    expect(found.map(a => a.used)).toEqual([true]);
  });

  it("describes a UTXO account by its xpub and its hardened account path", async () => {
    const { ports } = fakePorts(["xpub(84'/0'/0')"]);
    const [first] = await collect(ports, {
      currencyId: "bitcoin",
      derivationModes: ["native_segwit"],
    });
    expect(first.descriptor).toEqual({
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: "xpub(84'/0'/0')",
      path: "m/84h/0h/0h",
    });
  });

  it("scans every mode of the currency by default, in order", async () => {
    const { ports } = fakePorts([]);
    const found = await collect(ports, { currencyId: "bitcoin" });
    expect(found.map(a => a.derivationMode)).toEqual(["native_segwit", "taproot", "segwit", ""]);
  });

  it("emits the same accounts whatever the lookahead, and checks ahead concurrently", async () => {
    const used = [0, 1, 4].map(i => addressOf(`44'/60'/${i}'/0/0`));
    const options = { currencyId: "ethereum", derivationModes: [""] } as const;
    const sequential = await collect(fakePorts(used).ports, options);

    let inFlight = 0;
    let maxInFlight = 0;
    const lookahead = fakePorts(used);
    const exists = lookahead.ports.exists;
    lookahead.ports.exists = async (descriptor, signal) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      inFlight--;
      return exists(descriptor, signal);
    };
    const ahead = await collect(lookahead.ports, { ...options, lookahead: 4 });

    expect(ahead).toEqual(sequential);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it("derives one account at a time even when checking ahead", async () => {
    let deriving = 0;
    let maxDeriving = 0;
    const { ports } = fakePorts([], {
      derive: async request => {
        deriving++;
        maxDeriving = Math.max(maxDeriving, deriving);
        await new Promise(resolve => setTimeout(resolve, 2));
        deriving--;
        return { type: "address", address: addressOf(request.path) };
      },
    });
    await collect(ports, { currencyId: "ethereum", derivationModes: ["ethM"], lookahead: 5 });
    expect(maxDeriving).toBe(1);
  });

  it("aborts what is in flight when unsubscribed", async () => {
    let signal: AbortSignal | undefined;
    const { ports } = fakePorts([], {
      derive: (_request, abortSignal) => {
        signal = abortSignal;
        return new Promise<DerivedKey>(() => undefined);
      },
    });
    const subscription = discoverAccounts(ports, { currencyId: "ethereum" }).subscribe();
    await Promise.resolve();
    subscription.unsubscribe();
    expect(signal?.aborted).toBe(true);
  });
  it("asks nothing more once a mode has ended, whatever was queued by the lookahead", async () => {
    const { ports, requests } = fakePorts([]);
    await collect(ports, { currencyId: "ethereum", derivationModes: [""], lookahead: 6 });
    const derived = requests.length;
    const checked = (ports.exists as jest.Mock).mock.calls.length;
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(requests).toHaveLength(derived);
    expect(ports.exists).toHaveBeenCalledTimes(checked);
    expect(derived).toBeLessThan(6);
  });
});

import { lastValueFrom, take, toArray } from "rxjs";
import { AccountDescriptorSchema, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountCandidate } from "@domain/entity-derivation";
import { discoverAccounts, type DiscoveredAccount, type DiscoverOptions } from "./discoverAccounts";
import { UnknownDiscoveryCurrencyError } from "./errors";

const unsupportedDerivation = () =>
  Object.assign(new Error("no such mode"), { name: "UnsupportedDerivation" });
import type { DiscoveryHost } from "./host";

const addressOf = ({ derivationMode, index }: AccountCandidate) => `0x${derivationMode}${index}`;

const descriptorOf = (candidate: AccountCandidate): AccountDescriptor =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: candidate.network,
    key: addressOf(candidate),
    path: candidate.addressPath,
  });

type Fake = {
  used?: readonly string[];
  failDerive?: Readonly<Record<string, unknown>>;
  failStatus?: Readonly<Record<string, Error>>;
};

/** A device deriving `0x<mode><index>`, and a chain where only `used` addresses have history. */
function fakeHost({ used = [], failDerive = {}, failStatus = {} }: Fake = {}) {
  let tick = 0;
  const derived: string[] = [];
  const asked: { address: string; tick: number }[] = [];
  const host: DiscoveryHost = {
    derive: async candidate => {
      const address = addressOf(candidate);
      derived.push(address);
      tick++;
      if (failDerive[address]) throw failDerive[address];
      return descriptorOf(candidate);
    },
    readStatus: async descriptor => {
      const address = descriptor.key;
      asked.push({ address, tick });
      if (failStatus[address]) throw failStatus[address];
      return { used: used.includes(address), gate: null };
    },
  };
  return { host, derived, asked };
}

/** A promise held until `release` is called. */
function gate() {
  let resolveHeld: (() => void) | undefined;
  const held = new Promise<void>(resolve => {
    resolveHeld = resolve;
  });
  return { held, release: () => resolveHeld?.() };
}

const scan = (host: DiscoveryHost, options: Partial<DiscoverOptions> = {}) =>
  lastValueFrom(
    discoverAccounts(host, { currencyId: "ethereum", derivationModes: [""], ...options }).pipe(
      toArray(),
    ),
  );

const found = (accounts: DiscoveredAccount[]) =>
  accounts.map(({ descriptor, status }) => `${descriptor.key}:${status.used}`);

describe("discoverAccounts", () => {
  it("emits every used account, then the first empty one, and stops at the gap limit", async () => {
    const { host, derived } = fakeHost({ used: ["0x0", "0x1"] });
    expect(found(await scan(host))).toEqual(["0x0:true", "0x1:true", "0x2:false"]);
    expect(derived).toEqual(["0x0", "0x1", "0x2"]);
  });

  it("crosses a gap of empty accounts no longer than the gap limit", async () => {
    const { host } = fakeHost({ used: ["0x0", "0x2"] });
    expect(found(await scan(host, { keychainObservableRange: 1 }))).toEqual([
      "0x0:true",
      "0x1:false",
      "0x2:true",
    ]);
  });

  it("gives each account its candidate: mode, index and paths", async () => {
    const { host } = fakeHost({ used: [] });
    const [account] = await scan(host);
    expect(account.candidate).toMatchObject({
      derivationMode: "",
      index: 0,
      accountPath: "m/44h/60h/0h",
      addressPath: "m/44h/60h/0h/0/0",
    });
  });

  it("derives the next account while a status loads, only within the gap limit", async () => {
    const { host, derived, asked } = fakeHost();
    expect(found(await scan(host, { keychainObservableRange: 2 }))).toEqual(["0x0:false"]);
    expect(asked).toEqual([
      { address: "0x0", tick: 2 },
      { address: "0x1", tick: 3 },
      { address: "0x2", tick: 3 },
    ]);
    expect(derived).toEqual(["0x0", "0x1", "0x2"]);
  });

  it("derives nothing ahead without a gap limit, even after a used account", async () => {
    const { host, asked } = fakeHost({ used: ["0x0", "0x1"] });
    await scan(host);
    expect(asked).toEqual([
      { address: "0x0", tick: 1 },
      { address: "0x1", tick: 2 },
      { address: "0x2", tick: 3 },
    ]);
  });

  it("crosses gaps of empty accounts with the next derived ahead", async () => {
    const { host, derived } = fakeHost({ used: ["0x0", "0x1", "0x3", "0x6"] });
    expect(found(await scan(host, { keychainObservableRange: 2 }))).toEqual([
      "0x0:true",
      "0x1:true",
      "0x2:false",
      "0x3:true",
      "0x6:true",
    ]);
    expect(derived).toEqual(["0x0", "0x1", "0x2", "0x3", "0x4", "0x5", "0x6", "0x7", "0x8", "0x9"]);
  });

  it("ignores a failure past the gap limit", async () => {
    const failure = new Error("device unplugged");
    const derive = fakeHost({ failDerive: { "0x1": failure } });
    expect(found(await scan(derive.host))).toEqual(["0x0:false"]);
    const readStatus = fakeHost({ failStatus: { "0x1": failure } });
    expect(found(await scan(readStatus.host))).toEqual(["0x0:false"]);
  });

  it("fails once the scan reaches an account that failed, after emitting the ones before", async () => {
    const { host } = fakeHost({ used: ["0x0"], failStatus: { "0x1": new Error("down") } });
    const emitted: string[] = [];
    const failure = await new Promise(resolve =>
      discoverAccounts(host, {
        currencyId: "ethereum",
        derivationModes: [""],
      }).subscribe({
        next: ({ descriptor }) => emitted.push(descriptor.key),
        error: resolve,
      }),
    );
    expect(failure).toEqual(new Error("down"));
    expect(emitted).toEqual(["0x0"]);
  });

  it("skips a mode on an UnsupportedDerivation that lost its prototype, as the legacy scan", async () => {
    const { host } = fakeHost({
      used: ["0xethM0"],
      failDerive: { "0x0": { name: "UnsupportedDerivation" } },
    });
    expect(found(await scan(host, { derivationModes: ["", "ethM"] }))).toEqual(["0xethM0:true"]);
  });

  it("skips a mode the device app does not support", async () => {
    const { host } = fakeHost({
      used: ["0xethM0"],
      failDerive: { "0x0": unsupportedDerivation() },
    });
    expect(found(await scan(host, { derivationModes: ["", "ethM"] }))).toEqual(["0xethM0:true"]);
  });

  it("ends a mode where the device answers no account, keeping the accounts found before it", async () => {
    const { host } = fakeHost({ used: ["0x0", "0x1", "0x2", "0xethM0"] });
    const endsAtTwo: DiscoveryHost = {
      derive: async (candidate, signal) =>
        candidate.derivationMode === "" && candidate.index === 2
          ? null
          : host.derive(candidate, signal),
      readStatus: host.readStatus,
    };
    expect(found(await scan(endsAtTwo, { derivationModes: ["", "ethM"] }))).toEqual([
      "0x0:true",
      "0x1:true",
      "0xethM0:true",
    ]);
  });

  it("does not count an empty account toward the gap limit while its key lists more", async () => {
    const { host } = fakeHost({ used: ["0x0", "0x3"] });
    const keyOfFour: DiscoveryHost = {
      derive: async candidate =>
        candidate.index > 3
          ? null
          : { descriptor: descriptorOf(candidate), keyHasMoreAccounts: candidate.index < 3 },
      readStatus: host.readStatus,
    };
    expect(found(await scan(keyOfFour))).toEqual(["0x0:true", "0x1:false", "0x3:true"]);
    expect(found(await scan(host))).toEqual(["0x0:true", "0x1:false"]);
  });

  it("derives nothing after the device answers no account, even with a gap limit left", async () => {
    const { host, derived } = fakeHost({ used: ["0x0", "0xethM0"] });
    const endsAtOne: DiscoveryHost = {
      derive: async (candidate, signal) => {
        if (candidate.derivationMode !== "") return host.derive(candidate, signal);
        if (candidate.index === 1) return null;
        if (candidate.index > 1) return new Promise(() => undefined);
        return host.derive(candidate, signal);
      },
      readStatus: host.readStatus,
    };
    expect(
      found(await scan(endsAtOne, { derivationModes: ["", "ethM"], keychainObservableRange: 3 })),
    ).toEqual(["0x0:true", "0xethM0:true"]);
    expect(derived).not.toContain("0x2");
  });

  it("emits the accounts before a derivation the host fails synchronously", async () => {
    const { host } = fakeHost({ used: ["0x0"] });
    const failure = new Error("device unplugged");
    const throwing: DiscoveryHost = {
      derive: (candidate, signal) => {
        if (candidate.index === 1) throw failure;
        return host.derive(candidate, signal);
      },
      readStatus: host.readStatus,
    };
    const emitted: string[] = [];
    const ended = new Promise(resolve =>
      discoverAccounts(throwing, {
        currencyId: "ethereum",
        derivationModes: [""],
        keychainObservableRange: 1,
      }).subscribe({ next: account => emitted.push(account.descriptor.key), error: resolve }),
    );
    await expect(ended).resolves.toBe(failure);
    expect(emitted).toEqual(["0x0"]);
  });

  it("derives nothing more once a subscriber unsubscribes on an account", async () => {
    const { host, derived } = fakeHost({ used: ["0x0", "0x1"] });
    const [first] = await lastValueFrom(
      discoverAccounts(host, { currencyId: "ethereum", derivationModes: [""] }).pipe(
        take(1),
        toArray(),
      ),
    );
    expect(first.descriptor.key).toBe("0x0");
    expect(derived).toEqual(["0x0"]);
  });

  it("starts no derivation nor status read once unsubscribed", async () => {
    const { held, release } = gate();
    const { host, derived, asked } = fakeHost({ used: ["0x0", "0x1", "0x2", "0x3"] });
    const slowHost: DiscoveryHost = {
      derive: async (candidate, signal) => {
        if (candidate.index === 1) await held;
        return host.derive(candidate, signal);
      },
      readStatus: host.readStatus,
    };
    const subscription = discoverAccounts(slowHost, {
      currencyId: "ethereum",
      derivationModes: [""],
    }).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    subscription.unsubscribe();
    release();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(derived).toEqual(["0x0", "0x1"]);
    expect(asked.map(({ address }) => address)).toEqual(["0x0"]);
  });

  it("aborts the signal handed to the host once unsubscribed", async () => {
    let seen: AbortSignal | undefined;
    const host: DiscoveryHost = {
      derive: (_candidate, signal) => {
        seen = signal;
        return new Promise(() => undefined);
      },
      readStatus: async () => ({ used: false, gate: null }),
    };
    const subscription = discoverAccounts(host, { currencyId: "ethereum" }).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    subscription.unsubscribe();
    expect(seen?.aborted).toBe(true);
  });

  it("fails on an unknown currency", async () => {
    const { host } = fakeHost();
    await expect(scan(host, { currencyId: "nope" })).rejects.toBeInstanceOf(
      UnknownDiscoveryCurrencyError,
    );
  });

  it("aborts a derivation prefetched by a mode that fails", async () => {
    const signals: AbortSignal[] = [];
    const { host } = fakeHost({ failStatus: { "0x0": new Error("down") } });
    const recording: DiscoveryHost = {
      derive: (candidate, signal) => {
        signals.push(signal);
        if (candidate.index === 1) {
          return new Promise((_, reject) =>
            signal.addEventListener("abort", () => reject(signal.reason)),
          );
        }
        return host.derive(candidate, signal);
      },
      readStatus: host.readStatus,
    };
    await expect(scan(recording, { keychainObservableRange: 1 })).rejects.toEqual(
      new Error("down"),
    );
    expect(signals[1].aborted).toBe(true);
  });

  it("fails only once the derivation prefetched ahead settled", async () => {
    const { held, release } = gate();
    const { host } = fakeHost({ failStatus: { "0x0": new Error("down") } });
    const prefetching: DiscoveryHost = {
      derive: async (candidate, signal) => {
        if (candidate.index === 1) await held;
        return host.derive(candidate, signal);
      },
      readStatus: host.readStatus,
    };
    const ended = jest.fn();
    discoverAccounts(prefetching, {
      currencyId: "ethereum",
      derivationModes: [""],
      keychainObservableRange: 1,
    }).subscribe({ complete: ended, error: ended });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(ended).not.toHaveBeenCalled();
    release();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("leaves no rejection unhandled when a prefetch fails before the scan reaches it", async () => {
    const unhandled = jest.fn();
    process.on("unhandledRejection", unhandled);
    const { host } = fakeHost({ failDerive: { "0x1": new Error("unplugged") } });
    const slowStatus: DiscoveryHost = {
      derive: host.derive,
      readStatus: async (descriptor, signal) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return host.readStatus(descriptor, signal);
      },
    };
    await expect(scan(slowStatus, { keychainObservableRange: 1 })).rejects.toEqual(
      new Error("unplugged"),
    );
    await new Promise(resolve => setTimeout(resolve, 10));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

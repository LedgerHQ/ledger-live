import { lastValueFrom, toArray } from "rxjs";
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
  failDerive?: Readonly<Record<string, Error>>;
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

  it("asks the status of a whole window in the same tick, once all of it is derived", async () => {
    const { host, asked } = fakeHost({ used: ["0x0", "0x1", "0x2"] });
    await scan(host, { window: 3 });
    expect(asked.slice(0, 3)).toEqual([
      { address: "0x0", tick: 3 },
      { address: "0x1", tick: 3 },
      { address: "0x2", tick: 3 },
    ]);
  });

  it.each([
    { window: 1, lookahead: 1 },
    { window: 2, lookahead: 1 },
    { window: 3, lookahead: 2 },
    { window: 5, lookahead: 3 },
  ])("finds the same accounts with $window per window and $lookahead in flight", async options => {
    const { host } = fakeHost({ used: ["0x0", "0x1", "0x3", "0x6"] });
    expect(found(await scan(host, { ...options, keychainObservableRange: 2 }))).toEqual([
      "0x0:true",
      "0x1:true",
      "0x2:false",
      "0x3:true",
      "0x6:true",
    ]);
  });

  it.each([1, 2])("ignores a failure past the gap limit, with %p per window", async window => {
    const failure = new Error("device unplugged");
    const derive = fakeHost({ failDerive: { "0x1": failure } });
    expect(found(await scan(derive.host, { window }))).toEqual(["0x0:false"]);
    const readStatus = fakeHost({ failStatus: { "0x1": failure } });
    expect(found(await scan(readStatus.host, { window }))).toEqual(["0x0:false"]);
  });

  it("fails once the scan reaches an account that failed, after emitting the ones before", async () => {
    const { host } = fakeHost({ used: ["0x0"], failStatus: { "0x1": new Error("down") } });
    const emitted: string[] = [];
    const failure = await new Promise(resolve =>
      discoverAccounts(host, {
        currencyId: "ethereum",
        derivationModes: [""],
        window: 3,
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
      failDerive: { "0x0": { name: "UnsupportedDerivation" } as unknown as Error },
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
    expect(found(await scan(endsAtTwo, { derivationModes: ["", "ethM"], window: 2 }))).toEqual([
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

  it("derives nothing after the device answers no account, even later in the same window", async () => {
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
      found(await scan(endsAtOne, { derivationModes: ["", "ethM"], window: 3, lookahead: 2 })),
    ).toEqual(["0x0:true", "0xethM0:true"]);
    expect(derived).not.toContain("0x2");
  });

  it("starts no derivation nor status read once unsubscribed", async () => {
    let release: () => void = () => undefined;
    const held = new Promise<void>(resolve => (release = resolve));
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
      window: 4,
    }).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    subscription.unsubscribe();
    release();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(derived).toEqual(["0x0", "0x1"]);
    expect(asked).toEqual([]);
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

  it("treats a fractional window as a whole one", async () => {
    const { host, asked } = fakeHost({ used: ["0x0"] });
    expect(found(await scan(host, { window: 1.5 }))).toEqual(["0x0:true", "0x1:false"]);
    expect(asked[0]).toEqual({ address: "0x0", tick: 1 });
  });

  it("aborts the requests of a mode once it ends, so the next mode gets the device", async () => {
    const signals: AbortSignal[] = [];
    const { host } = fakeHost({ used: ["0xethM0"] });
    const recording: DiscoveryHost = {
      derive: (candidate, signal) => {
        signals.push(signal);
        if (candidate.derivationMode === "" && candidate.index === 1) {
          return new Promise((_, reject) =>
            signal.addEventListener("abort", () => reject(signal.reason)),
          );
        }
        return host.derive(candidate, signal);
      },
      readStatus: host.readStatus,
    };
    const accounts = await scan(recording, { derivationModes: ["", "ethM"], lookahead: 2 });
    expect(found(accounts)).toEqual(["0x0:false", "0xethM0:true"]);
    expect(signals[1].aborted).toBe(true);
  });

  it.each([
    ["completes", undefined],
    ["fails", new Error("down")],
  ])("%s only once a derivation prefetched past the end settled", async (_, failure) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>(resolve => (release = resolve));
    const { host } = fakeHost({ failStatus: failure ? { "0x0": failure } : {} });
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
      lookahead: 2,
      keychainObservableRange: 0,
    }).subscribe({ complete: ended, error: ended });
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(ended).not.toHaveBeenCalled();
    release();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it("leaves no rejection unhandled when a mode is skipped mid-window", async () => {
    const unhandled = jest.fn();
    process.on("unhandledRejection", unhandled);
    const { host } = fakeHost({ failDerive: { "0x0": unsupportedDerivation() } });
    await scan(host, { window: 2 });
    await new Promise(resolve => setTimeout(resolve, 10));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

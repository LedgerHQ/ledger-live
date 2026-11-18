import { Observable, of, throwError } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { deriveOnSession, deriveOnTransport, type RunDeviceJob } from "./deriveOnSession";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { RunOnTransport } from "../../coin-modules/types";
import { LegacyDeriveUnsupportedError } from "./errors";

const loadSetupForFamily = jest.fn();
const getAccountDescriptorType = jest.fn(() => "address");
jest.mock("../../coin-modules/registry", () => ({
  loadSetupForFamily: (family: string) => loadSetupForFamily(family),
  getAccountDescriptorType: () => getAccountDescriptorType(),
}));
const getAddress = jest.fn();
jest.mock("../../hw/getAddress", () => ({
  __esModule: true,
  default: (...args: unknown[]) => getAddress(...args),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const candidate = candidateOf(bitcoin, "native_segwit", 0);

const anyTransport: Transport = Object.create(Transport.prototype);
const runOnTransport: RunDeviceJob = job => job(anyTransport);

describe("deriveOnTransport", () => {
  it("uses the family's own derivation when it has one", async () => {
    const descriptor = { type: "utxo" };
    const deriveAccountDescriptor = jest.fn(() => of(descriptor));
    loadSetupForFamily.mockResolvedValue({ deriveAccountDescriptor });
    const derive = deriveOnTransport(runOnTransport);
    await expect(derive(candidate, new AbortController().signal)).resolves.toBe(descriptor);
    expect(deriveAccountDescriptor).toHaveBeenCalledWith(expect.any(Function), bitcoin, candidate);
  });

  it("hands the family's job the derivation's signal, to check between its device reads", async () => {
    const signals: AbortSignal[] = [];
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: (run: RunOnTransport) =>
        run((_transport, signal) => {
          signals.push(signal);
          return of({ type: "utxo" });
        }),
    });
    const mode = new AbortController().signal;
    await deriveOnTransport(runOnTransport)(candidate, mode);
    expect(signals).toEqual([mode]);
  });

  it("gives the family one runner per mode, so what it caches does not outlive a scan", async () => {
    const runners: unknown[] = [];
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: (runner: unknown) => {
        runners.push(runner);
        return of({ type: "utxo" });
      },
    });
    const derive = deriveOnTransport(runOnTransport);
    const mode = new AbortController().signal;
    await derive(candidate, mode);
    await derive(candidate, mode);
    await derive(candidate, new AbortController().signal);
    expect(runners[0]).toBe(runners[1]);
    expect(runners[2]).not.toBe(runners[0]);
  });

  it("keeps the device until its call answers, then rejects an aborted derivation", async () => {
    let answer: (descriptor: unknown) => void = () => undefined;
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: () =>
        new Observable(subscriber => {
          answer = descriptor => {
            subscriber.next(descriptor);
            subscriber.complete();
          };
        }),
    });
    const controller = new AbortController();
    const settled = jest.fn();
    const pending = deriveOnTransport(runOnTransport)(candidate, controller.signal);
    pending.catch(settled);
    await new Promise(resolve => setTimeout(resolve, 0));
    controller.abort();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(settled).not.toHaveBeenCalled();
    answer({ type: "utxo" });
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("does not start a derivation already aborted", async () => {
    const deriveAccountDescriptor = jest.fn(() => of({ type: "utxo" }));
    loadSetupForFamily.mockResolvedValue({ deriveAccountDescriptor });
    const controller = new AbortController();
    controller.abort();
    await expect(
      deriveOnTransport(runOnTransport)(candidate, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(deriveAccountDescriptor).not.toHaveBeenCalled();
  });

  it("ends the mode when the app is too old for the path, whatever the family", async () => {
    const outdated = { name: "UpdateYourApp", message: "old app" };
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: () => throwError(() => outdated),
    });
    await expect(
      deriveOnTransport(runOnTransport)(candidate, new AbortController().signal),
    ).resolves.toBeNull();
  });

  it("fails on any other derivation error", async () => {
    const failure = new Error("unplugged");
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: () => throwError(() => failure),
    });
    await expect(
      deriveOnTransport(runOnTransport)(candidate, new AbortController().signal),
    ).rejects.toBe(failure);
  });

  it("fails for a family known by an xpub without its own derivation", async () => {
    loadSetupForFamily.mockResolvedValue({});
    getAccountDescriptorType.mockReturnValueOnce("utxo");
    await expect(
      deriveOnTransport(runOnTransport)(candidate, new AbortController().signal),
    ).rejects.toBeInstanceOf(LegacyDeriveUnsupportedError);
  });
});

describe("deriveOnTransport with the family resolver", () => {
  beforeEach(() => loadSetupForFamily.mockResolvedValue({}));

  it("keys an address family on the address, at the legacy spelling of its path", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    getAddress.mockResolvedValue({ address, publicKey: "04ab", path: "44'/60'/0'/0/0" });
    const descriptor = await deriveOnTransport(runOnTransport)(
      candidateOf(ethereum, "", 0),
      new AbortController().signal,
    );
    expect(getAddress).toHaveBeenCalledWith(anyTransport, {
      currency: ethereum,
      path: "44'/60'/0'/0/0",
      derivationMode: "",
    });
    expect(descriptor).toEqual({
      purpose: "account",
      version: "2",
      type: "address",
      network: "ethereum",
      key: address,
      path: "m/44h/60h/0h/0/0",
    });
  });

  it("keys a public-key family on its lowercase public key", async () => {
    const ton = getCryptoCurrencyById("ton");
    const publicKey = "AB".repeat(32);
    getAddress.mockResolvedValue({ address: "UQ-ton-address", publicKey, path: "" });
    const descriptor = await deriveOnTransport(runOnTransport)(
      candidateOf(ton, "ton", 2),
      new AbortController().signal,
    );
    expect(getAddress).toHaveBeenCalledWith(anyTransport, {
      currency: ton,
      path: "44'/607'/0'/0'/2'/0'",
      derivationMode: "ton",
    });
    expect(descriptor).toEqual({
      purpose: "account",
      version: "2",
      type: "address",
      network: "ton",
      key: "ab".repeat(32),
      path: "m/44h/607h/0h/0h/2h/0h",
    });
  });
});

describe("deriveOnSession", () => {
  it("runs each derivation on a transport of its own over the session", async () => {
    const sendApdu = jest.fn();
    const transports: unknown[] = [];
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: (run: RunOnTransport) =>
        run(transport => {
          transports.push(transport);
          return of({ type: "utxo" });
        }),
    });
    const derive = deriveOnSession({
      dmk: { sendApdu } as unknown as DeviceManagementKit,
      sessionId: "session",
    });
    await derive(candidate, new AbortController().signal);
    await derive(candidate, new AbortController().signal);
    expect(transports).toHaveLength(2);
    expect(transports[0]).not.toBe(transports[1]);
    expect(transports[0]).toMatchObject({ sessionId: "session" });
  });

  it("starts a derivation of a new scan only once the call of a stopped one settled", async () => {
    const answers: ((descriptor: unknown) => void)[] = [];
    const started: number[] = [];
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: (run: RunOnTransport) =>
        run(
          () =>
            new Observable(subscriber => {
              started.push(answers.length);
              answers.push(descriptor => {
                subscriber.next(descriptor);
                subscriber.complete();
              });
            }),
        ),
    });
    const session = { dmk: {} as DeviceManagementKit, sessionId: "shared" };
    const stopped = new AbortController();
    const first = deriveOnSession(session)(candidate, stopped.signal);
    await new Promise(resolve => setTimeout(resolve, 0));
    stopped.abort(new Error("stopped"));
    const second = deriveOnSession(session)(candidate, new AbortController().signal);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(started).toEqual([0]);
    answers[0]({ type: "utxo" });
    await expect(first).rejects.toThrow("stopped");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(started).toEqual([0, 1]);
    answers[1]({ type: "utxo" });
    await expect(second).resolves.toEqual({ type: "utxo" });
  });

  it("never calls the device for a derivation stopped while it waited for the session", async () => {
    const answers: ((descriptor: unknown) => void)[] = [];
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: (run: RunOnTransport) =>
        run(
          () =>
            new Observable(subscriber => {
              answers.push(descriptor => {
                subscriber.next(descriptor);
                subscriber.complete();
              });
            }),
        ),
    });
    const session = { dmk: {} as DeviceManagementKit, sessionId: "queued" };
    const first = deriveOnSession(session)(candidate, new AbortController().signal);
    await new Promise(resolve => setTimeout(resolve, 0));
    const stopped = new AbortController();
    const queued = deriveOnSession(session)(candidate, stopped.signal);
    await new Promise(resolve => setTimeout(resolve, 0));
    stopped.abort(new Error("stopped"));
    answers[0]({ type: "utxo" });
    await expect(first).resolves.toEqual({ type: "utxo" });
    await expect(queued).rejects.toThrow("stopped");
    expect(answers).toHaveLength(1);
  });
});

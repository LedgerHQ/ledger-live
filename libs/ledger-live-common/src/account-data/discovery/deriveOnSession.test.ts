import { Observable, of, throwError } from "rxjs";
import { candidateOf } from "@domain/entity-derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { deriveOnSession, deriveOnTransport } from "./deriveOnSession";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { RunOnTransport } from "../../coin-modules/types";
import { LegacyDeriveUnsupportedError } from "./errors";

const loadSetupForFamily = jest.fn();
const getAccountDescriptorType = jest.fn(() => "address");
jest.mock("../../coin-modules/registry", () => ({
  loadSetupForFamily: (family: string) => loadSetupForFamily(family),
  getAccountDescriptorType: () => getAccountDescriptorType(),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const candidate = candidateOf(bitcoin, "native_segwit", 0);

const runOnTransport = <T>(job: (transport: never) => Observable<T>) => job({} as never);

describe("deriveOnTransport", () => {
  it("uses the family's own derivation when it has one", async () => {
    const descriptor = { type: "utxo" };
    const deriveAccountDescriptor = jest.fn(() => of(descriptor));
    loadSetupForFamily.mockResolvedValue({ deriveAccountDescriptor });
    const derive = deriveOnTransport(runOnTransport);
    await expect(derive(candidate, new AbortController().signal)).resolves.toBe(descriptor);
    expect(deriveAccountDescriptor).toHaveBeenCalledWith(runOnTransport, bitcoin, candidate);
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

  it("ends the mode on an error the family's scan ends on", async () => {
    const outdated = Object.assign(new Error("old app"), { name: "UpdateYourApp" });
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: () => throwError(() => outdated),
      endsScanOn: (error: unknown) => error === outdated,
    });
    await expect(
      deriveOnTransport(runOnTransport)(candidate, new AbortController().signal),
    ).resolves.toBeNull();
  });

  it("fails on an error the family's scan does not end on", async () => {
    const failure = new Error("unplugged");
    loadSetupForFamily.mockResolvedValue({
      deriveAccountDescriptor: () => throwError(() => failure),
      endsScanOn: () => false,
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

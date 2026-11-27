import { Observable, concatMap, from, lastValueFrom, of, toArray } from "rxjs";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { CompleteAccountDescriptors } from "../../coin-modules/types";
import { completeOnSession, needsCompletion } from "./completeOnSession";
import { MissingAccountCompletionError } from "./errors";
import { onSession } from "./session";

const loadSetupForFamily = jest.fn();
const getAccountCompletion = jest.fn();
jest.mock("../../coin-modules/registry", () => ({
  loadSetupForFamily: (family: string) => loadSetupForFamily(family),
  getAccountCompletion: (family: string) => getAccountCompletion(family),
}));

const aleo = AccountDescriptorSchema.parse({
  purpose: "account",
  version: "2",
  type: "address",
  network: "aleo",
  key: "aleo1first",
  path: "m/44h/683h/0h/0h",
});
const aleoSecond = AccountDescriptorSchema.parse({
  ...aleo,
  key: "aleo1second",
  path: "m/44h/683h/1h/0h",
});

const dmk: DeviceManagementKit = Object.create(null);
const session = { dmk, sessionId: "session" };

/** A family whose step runs one device job per account, and completes it with the job's result. */
const oneJobPerAccount =
  (onJob: (transport: unknown) => void): CompleteAccountDescriptors =>
  (run, _currency, selected) =>
    run(transport => {
      onJob(transport);
      return of(...selected.map(source => ({ source, state: { type: "refused" as const } })));
    });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("completeOnSession", () => {
  it("runs the family's step on a transport of the session", async () => {
    const transports: unknown[] = [];
    loadSetupForFamily.mockResolvedValue({
      completeAccountDescriptors: oneJobPerAccount(transport => transports.push(transport)),
    });
    const events = await lastValueFrom(completeOnSession(session)([aleo]).pipe(toArray()));
    expect(loadSetupForFamily).toHaveBeenCalledWith("aleo");
    expect(events).toEqual([{ source: aleo, state: { type: "refused" } }]);
    expect(transports).toEqual([expect.any(DmkCompatTransport)]);
  });

  it("fails for a family that announced no step", async () => {
    loadSetupForFamily.mockResolvedValue({});
    await expect(lastValueFrom(completeOnSession(session)([aleo]))).rejects.toBeInstanceOf(
      MissingAccountCompletionError,
    );
  });

  it("waits for the device job still running on the session, a stopped scan's derivation", async () => {
    let release: (() => void) | undefined;
    void onSession(session, () => new Promise<void>(resolve => (release = resolve)));
    const onJob = jest.fn();
    loadSetupForFamily.mockResolvedValue({ completeAccountDescriptors: oneJobPerAccount(onJob) });
    const completing = lastValueFrom(completeOnSession(session)([aleo]));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(onJob).not.toHaveBeenCalled();
    release?.();
    await completing;
    expect(onJob).toHaveBeenCalledTimes(1);
  });

  it("never calls the device for a completion stopped while it waited for the session", async () => {
    let release: (() => void) | undefined;
    void onSession(session, () => new Promise<void>(resolve => (release = resolve)));
    const onJob = jest.fn();
    loadSetupForFamily.mockResolvedValue({ completeAccountDescriptors: oneJobPerAccount(onJob) });
    const subscription = completeOnSession(session)([aleo]).subscribe({ error: () => {} });
    await new Promise(resolve => setTimeout(resolve, 0));
    subscription.unsubscribe();
    release?.();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(onJob).not.toHaveBeenCalled();
  });

  it("starts a new completion only once the device call of a stopped one settled, and asks nothing more of it", async () => {
    const started: string[] = [];
    const answers: (() => void)[] = [];
    const oneCallPerAccount: CompleteAccountDescriptors = (run, _currency, selected) =>
      from(selected).pipe(
        concatMap(source =>
          run(
            () =>
              new Observable<{ source: typeof source; state: { type: "refused" } }>(subscriber => {
                started.push(source.key);
                answers.push(() => {
                  subscriber.next({ source, state: { type: "refused" } });
                  subscriber.complete();
                });
              }),
          ),
        ),
      );
    loadSetupForFamily.mockResolvedValue({ completeAccountDescriptors: oneCallPerAccount });
    const stopped = completeOnSession(session)([aleo, aleoSecond]).subscribe({ error: () => {} });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(started).toEqual(["aleo1first"]);
    stopped.unsubscribe();
    const next = lastValueFrom(completeOnSession(session)([aleoSecond]).pipe(toArray()));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(started).toEqual(["aleo1first"]);
    answers[0]();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(started).toEqual(["aleo1first", "aleo1second"]);
    answers[1]();
    await expect(next).resolves.toEqual([{ source: aleoSecond, state: { type: "refused" } }]);
    expect(started).toEqual(["aleo1first", "aleo1second"]);
  });
});

describe("needsCompletion", () => {
  it("reads the family's loader, without loading its setup", () => {
    getAccountCompletion.mockReturnValueOnce({ kind: "viewKey" });
    expect(needsCompletion(aleo)).toBe(true);
    getAccountCompletion.mockReturnValueOnce(undefined);
    expect(needsCompletion(aleo)).toBe(false);
    expect(getAccountCompletion).toHaveBeenCalledWith("aleo");
    expect(loadSetupForFamily).not.toHaveBeenCalled();
  });
});

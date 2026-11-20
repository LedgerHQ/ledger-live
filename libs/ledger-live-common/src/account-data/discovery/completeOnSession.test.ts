import { lastValueFrom, of, toArray } from "rxjs";
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

import { lastValueFrom, toArray, type Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { AccountCompletionEvent } from "@features/platform-account-discovery/descriptor";
import { isDeviceDisconnectedError } from "@features/platform-device-intent";
import { CompletionAccountMismatchError } from "../../account-data/discovery/errors";
import type { RunOnTransport } from "../../coin-modules/types";
import { completeAccountDescriptors } from "./completeAccountDescriptors";
import { hederaConfig } from "./config";

const getPublicKey = jest.fn();
jest.mock("@ledgerhq/hw-app-hedera", () => jest.fn().mockImplementation(() => ({ getPublicKey })));
const getAccountsForPublicKey = jest.fn();
jest.mock("@ledgerhq/coin-hedera/network/api", () => ({
  apiClient: { getAccountsForPublicKey: (...args: unknown[]) => getAccountsForPublicKey(...args) },
}));

LiveConfig.setConfig(hederaConfig);
const hedera = getCryptoCurrencyById("hedera");
const PUBLIC_KEY = "f381f94b116a99518739e1bb394d1c8de281055d48b01dbc1625eebb06021ce5";

const discovered = (key: string, path = "m/44/3030") =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: "hedera",
    key,
    path,
  });

const first = discovered("0.0.11");
const second = discovered("0.0.22");
const otherPath = discovered("0.0.33", "m/44/3031");

const anyTransport: Transport = Object.create(Transport.prototype);
const runOnTransport: RunOnTransport = job => job(anyTransport, new AbortController().signal);

const run = (events: Observable<AccountCompletionEvent>) => lastValueFrom(events.pipe(toArray()));

const summary = (events: readonly AccountCompletionEvent[]) =>
  events.map(({ source, state }) => [source.key, state.type]);

describe("Hedera completeAccountDescriptors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPublicKey.mockResolvedValue(PUBLIC_KEY);
    getAccountsForPublicKey.mockResolvedValue([{ account: "0.0.11" }, { account: "0.0.22" }]);
  });

  it("gives the device public key of each account as its context, without asking an approval", async () => {
    const events = await run(completeAccountDescriptors(runOnTransport, hedera, [first, second]));
    expect(summary(events)).toEqual([
      ["0.0.11", "waiting"],
      ["0.0.22", "waiting"],
      ["0.0.11", "completed"],
      ["0.0.22", "completed"],
    ]);
    expect(events[2]).toEqual({
      source: first,
      state: { type: "completed", context: { publicKey: PUBLIC_KEY } },
    });
    expect(getPublicKey).toHaveBeenCalledWith("44/3030");
  });

  it("fails an account the key of this device does not control, and completes the others", async () => {
    getAccountsForPublicKey.mockResolvedValue([{ account: "0.0.11" }]);
    const events = await run(completeAccountDescriptors(runOnTransport, hedera, [first, second]));
    expect(summary(events).slice(2)).toEqual([
      ["0.0.11", "completed"],
      ["0.0.22", "failed"],
    ]);
    expect(events[3].state).toMatchObject({ error: expect.any(CompletionAccountMismatchError) });
  });

  it("never looks the accounts up once cancelled during the key read", async () => {
    const controller = new AbortController();
    getPublicKey.mockImplementationOnce(async () => {
      controller.abort(new Error("stopped"));
      return PUBLIC_KEY;
    });
    const cancellable: RunOnTransport = job => job(anyTransport, controller.signal);
    await expect(run(completeAccountDescriptors(cancellable, hedera, [first]))).rejects.toThrow(
      "stopped",
    );
    expect(getAccountsForPublicKey).not.toHaveBeenCalled();
  });

  it("reads the key and looks its accounts up once for accounts on one path", async () => {
    await run(completeAccountDescriptors(runOnTransport, hedera, [first, second]));
    expect(getPublicKey).toHaveBeenCalledTimes(1);
    expect(getAccountsForPublicKey).toHaveBeenCalledTimes(1);
  });

  it("stops on a disconnect with the device's error, for the Device Intent to retry", async () => {
    const disconnected = new Error("disconnected", {
      cause: { _tag: "DeviceDisconnectedWhileSendingError" },
    });
    getPublicKey.mockResolvedValueOnce(PUBLIC_KEY).mockRejectedValueOnce(disconnected);
    const seen: AccountCompletionEvent[] = [];
    const failure = await new Promise<unknown>(resolve =>
      completeAccountDescriptors(runOnTransport, hedera, [first, otherPath]).subscribe({
        next: event => seen.push(event),
        error: resolve,
      }),
    );
    expect(isDeviceDisconnectedError(failure)).toBe(true);
    expect(summary(seen).slice(2)).toEqual([["0.0.11", "completed"]]);
  });
});

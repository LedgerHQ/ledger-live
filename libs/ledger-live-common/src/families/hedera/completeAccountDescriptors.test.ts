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

const discovered = (key: string) =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: "hedera",
    key,
    path: "m/44/3030",
  });

const first = discovered("0.0.11");
const second = discovered("0.0.22");

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

  it("fails an account the key of this device does not control, so another seed cannot give its key", async () => {
    getAccountsForPublicKey.mockResolvedValueOnce([{ account: "0.0.99" }]);
    const events = await run(completeAccountDescriptors(runOnTransport, hedera, [first, second]));
    expect(summary(events).slice(2)).toEqual([
      ["0.0.11", "failed"],
      ["0.0.22", "completed"],
    ]);
    expect(events[2].state).toMatchObject({ error: expect.any(CompletionAccountMismatchError) });
  });

  it("never looks the accounts up once cancelled during the key read", async () => {
    const controller = new AbortController();
    let resolveKey: ((value: string) => void) | undefined;
    getPublicKey.mockReturnValueOnce(new Promise(resolve => (resolveKey = resolve)));
    const cancellable: RunOnTransport = job => job(anyTransport, controller.signal);
    const failure = new Promise<unknown>(resolve =>
      completeAccountDescriptors(cancellable, hedera, [first]).subscribe({ error: resolve }),
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    controller.abort();
    resolveKey?.(PUBLIC_KEY);
    expect(await failure).toBeDefined();
    expect(getAccountsForPublicKey).not.toHaveBeenCalled();
  });

  it("stops on a disconnect with the device's error, for the Device Intent to retry", async () => {
    const disconnected = new Error("disconnected", {
      cause: { _tag: "DeviceDisconnectedWhileSendingError" },
    });
    getPublicKey.mockResolvedValueOnce(PUBLIC_KEY).mockRejectedValueOnce(disconnected);
    const seen: AccountCompletionEvent[] = [];
    const failure = await new Promise<unknown>(resolve =>
      completeAccountDescriptors(runOnTransport, hedera, [first, second]).subscribe({
        next: event => seen.push(event),
        error: resolve,
      }),
    );
    expect(isDeviceDisconnectedError(failure)).toBe(true);
    expect(summary(seen).slice(2)).toEqual([["0.0.11", "completed"]]);
  });
});

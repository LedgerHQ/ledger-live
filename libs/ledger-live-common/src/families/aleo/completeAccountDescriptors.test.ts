import { lastValueFrom, toArray, type Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import aleoAddressResolver from "@ledgerhq/coin-aleo/signer/getAddress";
import aleoViewKeyResolver from "@ledgerhq/coin-aleo/signer/getViewKey";
import type { AleoSigner } from "@ledgerhq/coin-aleo/types";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { AccountCompletionEvent } from "@features/platform-account-discovery";
import { isDeviceDisconnectedError } from "@features/platform-device-intent";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { RunOnTransport } from "../../coin-modules/types";
import { aleoCurrency } from "./__mocks__/currency.mock";
import {
  CompletionAccountMismatchError,
  createCompleteAccountDescriptors,
} from "./completeAccountDescriptors";
import { createViewKeyResolver } from "./hw/getViewKey/resolver";

const first = "aleo1uhf67fhy46jvv5hadf586pkdarax6ppuzq8xtpk7jdk9hhujku8sfa39ml";
const second = "aleo1second00000000000000000000000000000000000000000000000000000";
const third = "aleo1thirdd00000000000000000000000000000000000000000000000000000";
const viewKey = "AViewKey1jyaKC65RhaGN3b6h79hLdwTBk3YAMbRL1MMeCArLDJ6E";

const discovered = (key: string, account: number) =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: "aleo",
    key,
    path: `m/44h/683h/${account}h/0h`,
  });

const getViewKey = jest.fn<Promise<{ viewKey: string }>, [string]>();
const getAddress = jest.fn<Promise<{ address: string }>, [string]>();
const signer = { getViewKey, getAddress } as unknown as AleoSigner;
const complete = createCompleteAccountDescriptors(
  createViewKeyResolver(() => signer, aleoViewKeyResolver),
  (_transport, options) => aleoAddressResolver((_deviceId, fn) => fn(signer))("", options),
);

const derivesScannedAccounts = (path: string) =>
  Promise.resolve({ address: [first, second, third][Number.parseInt(path.split("/")[2], 10)] });

const anyTransport: Transport = Object.create(Transport.prototype);
const runOnTransport: RunOnTransport = job => job(anyTransport, new AbortController().signal);

const run = (events: Observable<AccountCompletionEvent>) => lastValueFrom(events.pipe(toArray()));

const summary = (events: readonly AccountCompletionEvent[]) =>
  events.map(({ source, state }) => [source.key, state.type]);

const disconnected = () =>
  new Error("GetViewKeyDAError", { cause: { _tag: "DeviceDisconnectedWhileSendingError" } });

describe("Aleo completeAccountDescriptors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAddress.mockImplementation(derivesScannedAccounts);
  });

  it("asks the view key of each account on its path, and keys the account with it", async () => {
    getViewKey.mockResolvedValue({ viewKey });
    const events = await run(
      complete(runOnTransport, aleoCurrency, [discovered(first, 0), discovered(second, 1)]),
    );
    expect(summary(events)).toEqual([
      [first, "waiting"],
      [second, "waiting"],
      [first, "awaiting-approval"],
      [first, "completed"],
      [second, "awaiting-approval"],
      [second, "completed"],
    ]);
    expect(getViewKey.mock.calls).toEqual([["44'/683'/0'/0'"], ["44'/683'/1'/0'"]]);
    expect(events[3].state).toEqual({
      type: "completed",
      descriptor: { ...discovered(first, 0), key: `${first}.${viewKey}` },
    });
  });

  it("settles a refused account and goes on with the next", async () => {
    getViewKey.mockRejectedValueOnce(new UserRefusedOnDevice()).mockResolvedValue({ viewKey });
    const events = await run(
      complete(runOnTransport, aleoCurrency, [discovered(first, 0), discovered(second, 1)]),
    );
    expect(summary(events).slice(2)).toEqual([
      [first, "awaiting-approval"],
      [first, "refused"],
      [second, "awaiting-approval"],
      [second, "completed"],
    ]);
  });

  it("fails an account the device derives differently, without asking its view key", async () => {
    getAddress.mockResolvedValueOnce({ address: second });
    getViewKey.mockResolvedValue({ viewKey });
    const events = await run(
      complete(runOnTransport, aleoCurrency, [discovered(first, 0), discovered(second, 1)]),
    );
    expect(summary(events).slice(2)).toEqual([
      [first, "awaiting-approval"],
      [first, "failed"],
      [second, "awaiting-approval"],
      [second, "completed"],
    ]);
    expect(events[3].state).toMatchObject({
      error: expect.any(CompletionAccountMismatchError),
    });
    expect(getViewKey.mock.calls).toEqual([["44'/683'/1'/0'"]]);
  });

  it("never asks the view key once cancelled during the address read", async () => {
    const controller = new AbortController();
    let resolveAddress: ((value: { address: string }) => void) | undefined;
    getAddress.mockReturnValueOnce(new Promise(resolve => (resolveAddress = resolve)));
    const cancellable: RunOnTransport = job => job(anyTransport, controller.signal);
    const failure = new Promise<unknown>(resolve =>
      complete(cancellable, aleoCurrency, [discovered(first, 0)]).subscribe({ error: resolve }),
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    controller.abort();
    resolveAddress?.({ address: first });
    expect(await failure).toBeDefined();
    expect(getViewKey).not.toHaveBeenCalled();
  });

  it("stops on a disconnect with the device's error, for the Device Intent to retry", async () => {
    getViewKey.mockResolvedValueOnce({ viewKey }).mockRejectedValueOnce(disconnected());
    const seen: AccountCompletionEvent[] = [];
    const failure = await new Promise<unknown>(resolve =>
      complete(runOnTransport, aleoCurrency, [
        discovered(first, 0),
        discovered(second, 1),
        discovered(third, 2),
      ]).subscribe({ next: event => seen.push(event), error: resolve }),
    );
    expect(isDeviceDisconnectedError(failure)).toBe(true);
    expect(summary(seen).slice(3)).toEqual([
      [first, "awaiting-approval"],
      [first, "completed"],
      [second, "awaiting-approval"],
    ]);
    expect(getViewKey).toHaveBeenCalledTimes(2);
  });
});

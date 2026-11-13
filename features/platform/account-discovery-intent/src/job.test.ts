import { lastValueFrom, toArray } from "rxjs";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { AccountCandidate } from "@domain/entity-derivation";
import { accountDiscoveryIntentJob } from "./job";
import type { AccountDiscoveryIntentInput } from "./types";

const connection = { compatDeviceId: "device" } as unknown as DeviceConnectionResult;
const context = {} as DeviceExtractedContext;

const descriptorOf = (candidate: AccountCandidate) =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: candidate.network,
    key: `0x${candidate.index}`,
    path: candidate.addressPath,
  });

function run(readStatus: AccountDiscoveryIntentInput["readStatus"]) {
  const onResult = jest.fn();
  const createDerive = jest.fn(
    () => async (candidate: AccountCandidate) => descriptorOf(candidate),
  );
  const states = lastValueFrom(
    accountDiscoveryIntentJob({
      deviceConnectionResult: connection,
      deviceExtractedContext: context,
      input: {
        options: { currencyId: "ethereum", derivationModes: [""] },
        createDerive,
        readStatus,
      },
      onResult,
    }).pipe(toArray()),
  );
  return { states, onResult, createDerive };
}

describe("accountDiscoveryIntentJob", () => {
  it("derives on the executor's session, emits the accounts as found, then reports them", async () => {
    const { states, onResult, createDerive } = run(async descriptor => ({
      used: descriptor.key === "0x0",
      gate: null,
    }));
    const emitted = await states;
    expect(createDerive).toHaveBeenCalledWith(connection);
    expect(emitted.map(state => [state.type, state.discovered.length])).toEqual([
      ["scanning", 0],
      ["scanning", 1],
      ["scanning", 2],
      ["done", 2],
    ]);
    expect(onResult).toHaveBeenCalledWith(emitted.at(-1)?.discovered);
  });

  it("ends on an error state keeping the accounts found, without erroring the observable", async () => {
    const { states, onResult } = run(async descriptor => {
      if (descriptor.key === "0x1") throw new Error("down");
      return { used: true, gate: null };
    });
    const last = (await states).at(-1);
    expect(last).toMatchObject({ type: "error", error: new Error("down") });
    expect(last?.discovered).toHaveLength(1);
    expect(onResult).not.toHaveBeenCalled();
  });

  it("ends on an error state when the host cannot make a deriver for the session", async () => {
    const states = await lastValueFrom(
      accountDiscoveryIntentJob({
        deviceConnectionResult: connection,
        deviceExtractedContext: context,
        input: {
          options: { currencyId: "ethereum" },
          createDerive: () => {
            throw new Error("no signer");
          },
          readStatus: async () => ({ used: false, gate: null }),
        },
        onResult: jest.fn(),
      }).pipe(toArray()),
    );
    expect(states.at(-1)).toMatchObject({ type: "error", error: new Error("no signer") });
  });
});

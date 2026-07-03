import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import type { Observable } from "rxjs";
import {
  editAddressBookExternalAddressEvmIntentJob,
  registerAddressBookExternalAddressEvmIntentJob,
} from "./job";

const deviceConnectionResult = {} as DeviceConnectionResult;
const deviceExtractedContext = {} as DeviceExtractedContext;

async function collectJobStates<JobState>(observable: Observable<JobState>) {
  const states: JobState[] = [];

  await new Promise<void>((resolve, reject) => {
    observable.subscribe({
      complete: resolve,
      error: reject,
      next: state => states.push(state),
    });
  });

  return states;
}

describe("Address Book EVM dummy jobs", () => {
  describe("registerAddressBookExternalAddressEvmIntentJob", () => {
    it("GIVEN a new contact group input WHEN running the job THEN it emits a completed persistence result", async () => {
      // GIVEN
      const input = {
        address: "0xalice" as const,
        chainId: 1,
        contactName: "Alice",
        derivationPath: "44'/60'/0'/0/0",
        scope: "Kraken",
      };

      // WHEN
      const states = await collectJobStates(
        registerAddressBookExternalAddressEvmIntentJob({
          deviceConnectionResult,
          deviceExtractedContext,
          input,
        }),
      );

      // THEN
      expect(states).toEqual([
        { type: "pending" },
        { type: "awaiting-device-confirmation" },
        {
          type: "completed",
          result: {
            address: "0xalice",
            chainId: 1,
            contactName: "Alice",
            derivationPath: "44'/60'/0'/0/0",
            groupHandle: expect.stringMatching(/^group:alice:dummy:\d+$/),
            hmacProof: expect.stringMatching(/^proof:name:\d+$/),
            hmacRest: expect.stringMatching(/^proof:addr:\d+$/),
            mode: "newContactGroup",
            scope: "Kraken",
          },
        },
      ]);
    });
  });

  describe("editAddressBookExternalAddressEvmIntentJob", () => {
    it("GIVEN address and scope edits WHEN running the job THEN it emits a partial result before completion", async () => {
      // GIVEN
      const input = {
        chainId: 1,
        contactName: "Alice",
        derivationPath: "44'/60'/0'/0/0",
        groupHandle: "group:alice",
        hmacProof: "proof:name:v1",
        hmacRest: "proof:addr:v1",
        newAddress: "0xalice-v2" as const,
        newScope: "Base",
        previousAddress: "0xalice-v1" as const,
        previousScope: "Kraken",
      };

      // WHEN
      const states = await collectJobStates(
        editAddressBookExternalAddressEvmIntentJob({
          deviceConnectionResult,
          deviceExtractedContext,
          input,
        }),
      );

      // THEN
      expect(states).toEqual([
        { type: "pending" },
        { step: "identifier", type: "awaiting-device-confirmation" },
        {
          type: "partial-result",
          result: {
            address: "0xalice-v2",
            appliedStep: "identifier",
            chainId: 1,
            contactName: "Alice",
            derivationPath: "44'/60'/0'/0/0",
            groupHandle: "group:alice",
            hmacProof: "proof:name:v1",
            hmacRest: expect.stringMatching(/^proof:addr:\d+$/),
            scope: "Kraken",
          },
        },
        { step: "scope", type: "awaiting-device-confirmation" },
        {
          appliedSteps: ["identifier", "scope"],
          type: "completed",
          result: {
            address: "0xalice-v2",
            appliedStep: "scope",
            chainId: 1,
            contactName: "Alice",
            derivationPath: "44'/60'/0'/0/0",
            groupHandle: "group:alice",
            hmacProof: "proof:name:v1",
            hmacRest: expect.stringMatching(/^proof:addr:\d+$/),
            scope: "Base",
          },
        },
      ]);
    });
  });
});

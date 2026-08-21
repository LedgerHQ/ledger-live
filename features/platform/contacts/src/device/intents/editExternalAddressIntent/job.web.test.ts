import { editExternalAddressIntentJob } from "./job";
import type {
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
} from "./types";
import type { ContactIntentResult } from "../result";

const baseInput: EditExternalAddressIntentInput = {
  contactName: "Alice",
  previousScope: "Personal",
  newScope: "Personal",
  previousAddress: "0x1111111111111111111111111111111111111111",
  newAddress: "0x1111111111111111111111111111111111111111",
  blockchainFamily: "evm",
  chainId: 1,
  groupHandle: "group-handle",
  hmacProof: "contact-proof",
  hmacRest: "address-proof",
};

function executeJob(input: EditExternalAddressIntentInput) {
  const states: EditExternalAddressJobState[] = [];
  const onResult = jest.fn<void, [ContactIntentResult<EditExternalAddressResult>]>();

  editExternalAddressIntentJob({
    deviceConnectionResult: {} as never,
    deviceExtractedContext: {} as never,
    input,
    onResult,
  }).subscribe(state => states.push(state));

  return { states, onResult };
}

describe("editExternalAddressIntentJob", () => {
  it.each([
    {
      change: "identifier",
      input: {
        ...baseInput,
        newAddress: "0x2222222222222222222222222222222222222222",
      },
      expectedStates: ["pending", "awaiting-device-confirmation:identifier", "completed"],
    },
    {
      change: "scope",
      input: { ...baseInput, newScope: "Business" },
      expectedStates: ["pending", "awaiting-device-confirmation:scope", "completed"],
    },
    {
      change: "identifier and scope",
      input: {
        ...baseInput,
        newScope: "Business",
        newAddress: "0x2222222222222222222222222222222222222222",
      },
      expectedStates: [
        "pending",
        "awaiting-device-confirmation:identifier",
        "partial-result",
        "awaiting-device-confirmation:scope",
        "completed",
      ],
    },
  ])(
    "GIVEN a changed $change WHEN executing THEN it runs only the required steps",
    ({ input, expectedStates }) => {
      // GIVEN
      const formatState = (state: EditExternalAddressJobState) =>
        state.type === "awaiting-device-confirmation" ? `${state.type}:${state.step}` : state.type;

      // WHEN
      const { states, onResult } = executeJob(input);

      // THEN
      expect(states.map(formatState)).toEqual(expectedStates);
      expect(onResult).toHaveBeenCalledWith({
        type: "success",
        result: expect.objectContaining({
          scope: input.newScope,
          address: input.newAddress,
        }),
      });
    },
  );
});

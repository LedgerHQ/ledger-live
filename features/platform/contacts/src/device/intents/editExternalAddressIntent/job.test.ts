import type { ContactIntentResult } from "../result";
import { stubEditedAddressHmacRest } from "../stubProof";
import { editExternalAddressIntentJob } from "./job";
import type {
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
} from "./types";

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
  afterEach(() => {
    jest.useRealTimers();
  });

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
      jest.useFakeTimers();
      const formatState = (state: EditExternalAddressJobState) =>
        state.type === "awaiting-device-confirmation" ? `${state.type}:${state.step}` : state.type;

      // WHEN
      const { states, onResult } = executeJob(input);
      jest.runAllTimers();

      // THEN
      expect(states.map(formatState)).toEqual(expectedStates);
      expect(onResult).toHaveBeenCalledWith({
        type: "success",
        result: expect.objectContaining({
          scope: input.newScope,
          address: input.newAddress,
          hmacRest: stubEditedAddressHmacRest,
        }),
      });
    },
  );

  it("should wait two seconds after each device confirmation", () => {
    // GIVEN
    jest.useFakeTimers();
    const input = {
      ...baseInput,
      newAddress: "0x2222222222222222222222222222222222222222",
    };

    // WHEN
    const { states, onResult } = executeJob(input);
    jest.advanceTimersByTime(1_999);

    // THEN
    expect(states).toEqual([
      { type: "pending" },
      { type: "awaiting-device-confirmation", step: "identifier" },
    ]);
    expect(onResult).not.toHaveBeenCalled();

    // WHEN
    jest.advanceTimersByTime(1);

    // THEN
    expect(states).toEqual([
      { type: "pending" },
      { type: "awaiting-device-confirmation", step: "identifier" },
      { type: "completed" },
    ]);
    expect(onResult).toHaveBeenCalledTimes(1);
  });
});

import type { IntentPlatformDefinition } from "@features/platform-device-intent";
import { mockContactAddress, mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import { EditExternalAddressError } from "../../contactDeviceIntentsPort";
import type {
  ContactIntentResult,
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
} from "../intents";
import { createEditExternalAddressOperation } from "./editExternalAddress";

describe("createEditExternalAddressOperation", () => {
  const address = mockContactAddress();
  const contact = mockContactWithAddress({ addresses: [address] });
  const updatedLabel = mockContactAddress({ label: "Updated Ethereum" }).label;
  const updatedAddress = mockContactAddress({
    address: "0x2222222222222222222222222222222222222222",
  }).address;
  const intentDefinition = {} as IntentPlatformDefinition<
    EditExternalAddressJobState,
    EditExternalAddressIntentInput,
    undefined,
    ContactIntentResult<EditExternalAddressResult>
  >;

  it.each([
    { label: address.label, value: address.address, expected: null },
    { label: address.label, value: updatedAddress, expected: intentDefinition },
    { label: updatedLabel, value: address.address, expected: intentDefinition },
    { label: updatedLabel, value: updatedAddress, expected: intentDefinition },
  ] as const)(
    "GIVEN the corresponding field changes WHEN creating an edit THEN it selects the expected operation",
    ({ label, value, expected }) => {
      const input = { contact, address, updatedLabel: label, updatedAddress: value };

      const edit = createEditExternalAddressOperation(input, intentDefinition);

      expect(edit?.intentDefinition ?? null).toBe(expected);
    },
  );

  it("GIVEN a failed edit WHEN mapping its Result THEN it preserves the cause", () => {
    const cause = new Error("scope failed");
    const edit = createEditExternalAddressOperation(
      {
        contact,
        address,
        updatedLabel,
        updatedAddress,
      },
      intentDefinition,
    );
    if (edit === null) {
      throw new Error("Expected a combined operation");
    }

    const mapFailure = () =>
      edit.mapIntentResultToResult({
        type: "failure",
        error: cause,
      });

    try {
      mapFailure();
      throw new Error("Expected the result mapper to throw");
    } catch (error) {
      if (!(error instanceof EditExternalAddressError)) {
        throw error;
      }
      expect(error.cause).toBe(cause);
    }
  });
});

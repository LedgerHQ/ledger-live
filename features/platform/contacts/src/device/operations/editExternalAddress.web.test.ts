import { mockContactAddress, mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import { EditExternalAddressError } from "../../contactDeviceIntentsPort";
import { editExternalAddressIntentPlatformDefinition } from "../intents";
import { createEditExternalAddressOperation } from "./editExternalAddress";

describe("createEditExternalAddressOperation", () => {
  const address = mockContactAddress();
  const contact = mockContactWithAddress({ addresses: [address] });
  const updatedLabel = mockContactAddress({ label: "Updated Ethereum" }).label;
  const updatedAddress = mockContactAddress({
    address: "0x2222222222222222222222222222222222222222",
  }).address;

  it.each([
    { label: address.label, value: address.address, expected: null },
    {
      label: address.label,
      value: updatedAddress,
      expected: editExternalAddressIntentPlatformDefinition,
    },
    {
      label: updatedLabel,
      value: address.address,
      expected: editExternalAddressIntentPlatformDefinition,
    },
    {
      label: updatedLabel,
      value: updatedAddress,
      expected: editExternalAddressIntentPlatformDefinition,
    },
  ] as const)(
    "GIVEN the corresponding field changes WHEN creating an edit THEN it selects the expected operation",
    ({ label, value, expected }) => {
      // GIVEN
      const input = { contact, address, updatedLabel: label, updatedAddress: value };

      // WHEN
      const edit = createEditExternalAddressOperation(input);

      // THEN
      expect(edit?.intentDefinition ?? null).toBe(expected);
    },
  );

  it("GIVEN a failed edit WHEN mapping its Result THEN it preserves the cause", () => {
    // GIVEN
    const cause = new Error("scope failed");
    const edit = createEditExternalAddressOperation({
      contact,
      address,
      updatedLabel: updatedLabel,
      updatedAddress,
    });
    if (edit?.intentDefinition !== editExternalAddressIntentPlatformDefinition) {
      throw new Error("Expected a combined operation");
    }
    // WHEN
    const mapFailure = () =>
      edit.mapIntentResultToResult({
        type: "failure",
        error: cause,
      });

    // THEN
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

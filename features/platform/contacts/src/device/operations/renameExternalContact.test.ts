import type { IntentPlatformDefinition } from "@features/platform-device-intent";
import { ContactNameSchema } from "@domain/entity-contact";
import {
  mockContact,
  mockContactWithAddress,
  mockDeviceContactGroupCredentials,
} from "@domain/entity-contact/schema.mock";
import type {
  ContactIntentResult,
  RenameContactIntentInput,
  RenameContactJobState,
  RenameContactResult,
} from "../intents";
import { createRenameExternalContactOperation } from "./renameExternalContact";

describe("createRenameExternalContactOperation", () => {
  const contact = mockContactWithAddress();
  const updatedName = ContactNameSchema.parse("Updated Ben");
  const intentDefinition = {} as IntentPlatformDefinition<
    RenameContactJobState,
    RenameContactIntentInput,
    undefined,
    ContactIntentResult<RenameContactResult>
  >;

  it("GIVEN a contact without credentials WHEN creating a rename THEN it throws", () => {
    expect(() =>
      createRenameExternalContactOperation(
        {
          contact: { ...contact, deviceCredentials: undefined },
          name: updatedName,
        },
        intentDefinition,
      ),
    ).toThrow("A contact with device credentials is required");
  });

  it("GIVEN a credentialed contact without an address WHEN creating a rename THEN it builds the device intent", () => {
    const addresslessContact = mockContact({
      deviceCredentials: mockDeviceContactGroupCredentials(),
    });

    const operation = createRenameExternalContactOperation(
      { contact: addresslessContact, name: updatedName },
      intentDefinition,
    );

    expect(operation.intentInput).toEqual({
      previousContactName: addresslessContact.name,
      newContactName: updatedName,
      groupHandle: addresslessContact.deviceCredentials?.groupHandle,
      hmacProof: addresslessContact.deviceCredentials?.hmacProof,
    });
  });

  it("GIVEN any contact WHEN creating a rename THEN it initializes on the dashboard, never a coin app", () => {
    const operation = createRenameExternalContactOperation(
      { contact, name: updatedName },
      intentDefinition,
    );

    expect(operation.initializationInput).toEqual({
      appName: "BOLOS",
      dependencies: [],
      requireLatestFirmware: false,
    });
  });

  it("GIVEN a valid contact WHEN creating a rename THEN it builds the device intent", () => {
    const operation = createRenameExternalContactOperation(
      {
        contact,
        name: updatedName,
      },
      intentDefinition,
    );

    expect(operation.intentDefinition).toBe(intentDefinition);
    expect(operation.intentInput).toEqual({
      previousContactName: contact.name,
      newContactName: updatedName,
      groupHandle: contact.deviceCredentials?.groupHandle,
      hmacProof: contact.deviceCredentials?.hmacProof,
    });
  });

  it("GIVEN a successful rename WHEN mapping its result THEN it returns device credentials", () => {
    const operation = createRenameExternalContactOperation(
      {
        contact,
        name: updatedName,
      },
      intentDefinition,
    );

    expect(
      operation.mapIntentResultToResult({
        type: "success",
        result: {
          previousContactName: contact.name,
          contactName: updatedName,
          groupHandle: "group-handle",
          hmacProof: "proof",
        },
      }),
    ).toEqual({ groupHandle: "group-handle", hmacProof: "proof" });
  });

  it("GIVEN a failed rename WHEN mapping its result THEN it throws the cause", () => {
    const operation = createRenameExternalContactOperation(
      {
        contact,
        name: updatedName,
      },
      intentDefinition,
    );
    const cause = new Error("device rejected");

    expect(() =>
      operation.mapIntentResultToResult({
        type: "failure",
        error: cause,
      }),
    ).toThrow(cause);
  });
});

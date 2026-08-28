import type { IntentPlatformDefinition } from "@features/platform-device-intent";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
} from "@domain/entity-contact/schema.mock";
import type {
  ContactIntentResult,
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressJobState,
  RegisterExternalAddressResult,
} from "../intents";
import { createRegisterExternalAddressOperation } from "./registerExternalAddress";

describe("createRegisterExternalAddressOperation", () => {
  const address = mockContactAddress();
  const contact = mockContact({ addresses: [] });
  const contactWithCredentials = mockContactWithAddress({ addresses: [address] });
  const intentDefinition = {} as IntentPlatformDefinition<
    RegisterExternalAddressJobState,
    RegisterExternalAddressIntentInput,
    undefined,
    ContactIntentResult<RegisterExternalAddressResult>
  >;

  it("GIVEN a new contact group WHEN creating a registration THEN it omits existing credentials", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
      },
      intentDefinition,
    );

    expect(operation.intentDefinition).toBe(intentDefinition);
    expect(operation.intentInput).toMatchObject({
      contactName: contact.name,
      scope: address.label,
      address: address.address,
    });
    expect(operation.intentInput).not.toHaveProperty("existingContactGroup");
  });

  it("GIVEN an existing contact group WHEN creating a registration THEN it includes its credentials", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact: contactWithCredentials,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
      },
      intentDefinition,
    );

    expect(operation.intentInput.existingContactGroup).toEqual(
      contactWithCredentials.deviceCredentials,
    );
  });

  it("GIVEN a successful registration WHEN mapping its result THEN it returns device data", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
      },
      intentDefinition,
    );

    expect(
      operation.mapIntentResultToResult({
        type: "success",
        result: {
          mode: "newContactGroup",
          contactName: contact.name,
          scope: address.label,
          address: address.address,
          blockchainFamily: "evm",
          chainId: 1,
          groupHandle: "group-handle",
          hmacProof: "proof",
          hmacRest: "rest",
        },
      }),
    ).toEqual({
      deviceCredentials: { groupHandle: "group-handle", hmacProof: "proof" },
      addressDeviceContext: { blockchainFamily: "evm", chainId: 1, hmacRest: "rest" },
    });
  });

  it("GIVEN a failed registration WHEN mapping its result THEN it throws the cause", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
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

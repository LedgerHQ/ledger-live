import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
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
  const contactWithCredentials = mockContactWithAddress({
    addresses: [address],
  });
  const intentDefinition = {} as IntentPlatformDefinition<
    RegisterExternalAddressJobState,
    RegisterExternalAddressIntentInput,
    undefined,
    ContactIntentResult<RegisterExternalAddressResult>
  >;
  const config = {
    status: { type: "active" as const },
    name: "Ethereum",
    unit: { name: "ether", code: "ETH", magnitude: 18 },
    chainId: 1,
  };

  it("GIVEN a new contact group WHEN creating a registration THEN it omits existing credentials", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
        config,
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

  it("GIVEN an EVM network config WHEN creating a registration THEN it forwards its chain id", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact,
        currencyId: CryptoCurrencyIdSchema.parse("ethereum_classic"),
        label: address.label,
        address: address.address,
        config: {
          status: { type: "active" },
          name: "Ethereum",
          unit: { name: "ether", code: "ETH", magnitude: 18 },
          chainId: 99,
        },
      },
      intentDefinition,
    );

    expect(operation.intentInput.chainId).toBe(99);
  });

  it("GIVEN an existing contact group WHEN creating a registration THEN it includes its credentials", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact: contactWithCredentials,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
        config,
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
        config,
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
      addressDeviceContext: {
        blockchainFamily: "evm",
        chainId: 1,
        hmacRest: "rest",
      },
    });
  });

  it("GIVEN a failed registration WHEN mapping its result THEN it throws the cause", () => {
    const operation = createRegisterExternalAddressOperation(
      {
        contact,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
        config,
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

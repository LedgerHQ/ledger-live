import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
} from "@domain/entity-contact/schema.mock";
import { ContactAddressLabelSchema, ContactNameSchema } from "@domain/entity-contact";
import {
  createMockContactDeviceIntentsPort,
  type ContactDeviceIntentsPort,
} from "./contactDeviceIntentsPort";

describe("createMockContactDeviceIntentsPort", () => {
  let port: ContactDeviceIntentsPort;

  beforeEach(() => {
    port = createMockContactDeviceIntentsPort();
  });

  it("should return group credentials and an address context when registering an address", async () => {
    const contact = mockContact();
    const address = mockContactAddress();

    await expect(
      port.registerExternalAddress({
        contact,
        currencyId: address.currencyId,
        label: address.label,
        address: address.address,
      }),
    ).resolves.toEqual({
      deviceCredentials: {
        groupHandle: "mock-contact-group-handle",
        hmacProof: "mock-external-contact-name-proof",
      },
      addressDeviceContext: {
        blockchainFamily: "mock-blockchain-family",
        chainId: "mock-chain-id",
        hmacRest: "mock-external-address-proof",
      },
    });
  });

  it("should replace only the proof returned by a signed rename or scope edit", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;

    await expect(
      port.renameExternalContact({ contact, name: ContactNameSchema.parse("Raphael") }),
    ).resolves.toMatchObject({ hmacProof: "mock-external-contact-name-proof-after-rename" });
    await expect(
      port.editExternalAddress({
        contact,
        address,
        updatedLabel: ContactAddressLabelSchema.parse("Treasury"),
        updatedAddress: address.address,
      }),
    ).resolves.toMatchObject({
      blockchainFamily: address.device.blockchainFamily,
      chainId: address.device.chainId,
      hmacRest: "mock-external-address-proof-after-scope-edit",
    });
  });
});

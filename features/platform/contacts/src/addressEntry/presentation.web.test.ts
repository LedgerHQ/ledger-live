import { ContactAddressValueSchema } from "@domain/entity-contact";
import { resolveAddressInputPresentation } from "./presentation";

const labels = {
  validatingAddress: "Validating",
  validAddress: "Valid",
  invalidAddress: "Invalid",
  domainNotFound: "Domain not found",
  sanctionedAddress: "Sanctioned",
  validationUnavailable: "Unavailable",
  duplicateAddress: (contactName: string) => `This address is already used for ${contactName}.`,
};

describe("resolveAddressInputPresentation", () => {
  it("should expose validating feedback while validation is in progress", () => {
    expect(
      resolveAddressInputPresentation(
        {
          status: "validating",
          value: "0x123",
          resolvedAddress: null,
          inputMethod: "manual",
        },
        labels,
      ),
    ).toEqual({
      inputStatus: undefined,
      helperText: "Validating",
      showEnsDisclaimer: false,
    });
  });

  it("should expose ENS disclaimer for resolved domain addresses", () => {
    expect(
      resolveAddressInputPresentation(
        {
          status: "valid",
          value: "vitalik.eth",
          resolvedAddress: ContactAddressValueSchema.parse(
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          ),
          inputMethod: "ens",
        },
        labels,
      ),
    ).toEqual({
      inputStatus: "success",
      helperText: "Valid",
      showEnsDisclaimer: true,
    });
  });

  it("should map sanctioned validation errors to the dedicated helper text", () => {
    expect(
      resolveAddressInputPresentation(
        {
          status: "invalid",
          value: "0xbad",
          resolvedAddress: null,
          inputMethod: "manual",
          error: "sanctioned",
        },
        labels,
      ),
    ).toEqual({
      inputStatus: "error",
      helperText: "Sanctioned",
      showEnsDisclaimer: false,
    });
  });

  it("should show the contact name when address is already used for another contact", () => {
    expect(
      resolveAddressInputPresentation(
        {
          status: "invalid",
          value: "0xduplicate",
          resolvedAddress: null,
          inputMethod: "manual",
          error: "duplicate_address",
          contactName: "Alice",
        },
        labels,
      ),
    ).toEqual({
      inputStatus: "error",
      helperText: "This address is already used for Alice.",
      showEnsDisclaimer: false,
    });
  });
});

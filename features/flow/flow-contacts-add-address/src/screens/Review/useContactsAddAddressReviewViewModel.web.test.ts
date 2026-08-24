import { ContactAddressLabelSchema, ContactAddressValueSchema } from "@domain/entity-contact";
import { useContactsAddAddressReviewViewModel } from "./useContactsAddAddressReviewViewModel";

describe("useContactsAddAddressReviewViewModel", () => {
  it("should map the confirmed address and display context to review props", () => {
    const onContinue = jest.fn();
    const labels = {
      title: "Review address",
      addressLabel: "Address",
      currencyLabel: "Currency",
      networkLabel: "Network",
      nameLabel: "Address name",
      continue: "Confirm address",
    };
    const address = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
    const name = ContactAddressLabelSchema.parse("Exchange");

    expect(
      useContactsAddAddressReviewViewModel({
        addressEntry: {
          status: "valid",
          value: "ledger.eth",
          resolvedAddress: address,
          inputMethod: "ens",
        },
        addressLabel: {
          status: "valid",
          value: name,
          label: name,
          validationError: null,
        },
        displayContext: {
          assetDisplayName: "USDC",
          network: { networkId: "ethereum", displayName: "Ethereum" },
        },
        labels,
        onContinue,
      }),
    ).toEqual({
      address,
      currency: "USDC",
      network: "Ethereum",
      name,
      labels,
      onContinue,
    });
  });
});

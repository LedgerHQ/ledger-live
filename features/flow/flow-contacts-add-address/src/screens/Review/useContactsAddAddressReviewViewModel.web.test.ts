import { renderHook } from "@testing-library/react";
import { ContactAddressLabelSchema, ContactAddressValueSchema } from "@domain/entity-contact";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useContactsAddAddressReviewViewModel } from "./useContactsAddAddressReviewViewModel.web";

describe("useContactsAddAddressReviewViewModel", () => {
  it("should map the confirmed address and display context to review props", () => {
    const onContinue = jest.fn();
    const address = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
    const name = ContactAddressLabelSchema.parse("Exchange");
    const { result } = renderHook(
      () =>
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
          onContinue,
        }),
      { wrapper: I18nTestProvider },
    );

    expect(result.current).toEqual({
      address,
      currency: "USDC",
      network: "Ethereum",
      name,
      labels: {
        title: "contacts.addAddressReview.title",
        addressLabel: "contacts.addAddressReview.addressLabel",
        currencyLabel: "contacts.addAddressReview.currencyLabel",
        networkLabel: "contacts.addAddressReview.networkLabel",
        nameLabel: "contacts.addAddressReview.nameLabel",
        continue: "contacts.addAddressReview.continue",
      },
      onContinue,
    });
  });
});

import React from "react";
import { Linking } from "react-native";
import { fireEvent, render } from "@tests/test-renderer";
import { SwapTermsFooter } from "./SwapTermsFooter";

describe("SwapTermsFooter", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockImplementation(async () => {});
  });

  it("links the terms of the provider", () => {
    const { getByTestId, getAllByRole } = render(
      <SwapTermsFooter provider="changelly_v2" sponsored={false} />,
    );

    expect(getByTestId("wallet-api-exchange-terms")).toBeTruthy();
    // changelly_v2 shares the Changelly links: terms, AML/KYC and support.
    const links = getAllByRole("link");
    expect(links).toHaveLength(3);

    fireEvent.press(links[0]);
    expect(Linking.openURL).toHaveBeenCalledWith("https://changelly.com/terms-of-use");
    fireEvent.press(links[1]);
    expect(Linking.openURL).toHaveBeenCalledWith("https://changelly.com/aml-kyc");
  });

  it("only links the terms for providers that have no other notice", () => {
    const { getAllByRole } = render(<SwapTermsFooter provider="cic" sponsored={false} />);

    const links = getAllByRole("link");
    expect(links).toHaveLength(1);
    fireEvent.press(links[0]);
    expect(Linking.openURL).toHaveBeenCalledWith("https://criptointercambio.com/terms-of-use");
  });

  it("mentions who receives the transaction details when the fees are sponsored", () => {
    const { queryByText, rerender } = render(<SwapTermsFooter provider="cic" sponsored={false} />);
    expect(queryByText(/Blinklabs/)).toBeNull();

    rerender(<SwapTermsFooter provider="cic" sponsored />);

    expect(queryByText(/Blinklabs/)).toBeTruthy();
  });

  it("shows nothing for a provider it knows no terms for", () => {
    const { queryByTestId } = render(<SwapTermsFooter provider="unknown-provider" sponsored />);

    expect(queryByTestId("wallet-api-exchange-terms")).toBeNull();
  });
});

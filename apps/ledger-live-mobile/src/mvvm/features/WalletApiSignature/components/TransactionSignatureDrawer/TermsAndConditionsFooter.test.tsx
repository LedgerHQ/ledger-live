import React from "react";
import { Linking } from "react-native";
import { render, fireEvent } from "@tests/test-renderer";
import { TermsAndConditionsFooter } from "./TermsAndConditionsFooter";

// Router addresses / provider keys mirror live-common's dexProvidersContractAddress + termsOfUse maps.
const UNISWAP_ROUTER = "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad";
const UNISWAP_UNIVERSAL_ROUTER_V2 = "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af";
const ONEINCH_ROUTER = "0x111111125421ca6dc452d289314280a0f8842a65";

describe("TermsAndConditionsFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockImplementation(async () => {});
  });

  it("should render a single terms link when the recipient maps to a DEX without a privacy policy", () => {
    const { getByTestId, getAllByRole } = render(
      <TermsAndConditionsFooter
        manifestId="swap-live-app"
        manifestName="Swap"
        recipient={ONEINCH_ROUTER}
      />,
    );

    expect(getByTestId("wallet-api-signature-terms")).toBeTruthy();
    const links = getAllByRole("link");
    expect(links).toHaveLength(1);

    fireEvent.press(links[0]);
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://1inch.com/assets/Widget_1inch.com_Terms_of_Use.pdf",
    );
  });

  it("should render both terms and privacy links when the DEX has a privacy policy", () => {
    const { getAllByRole } = render(
      <TermsAndConditionsFooter
        manifestId="swap-live-app"
        manifestName="Swap"
        recipient={UNISWAP_ROUTER}
      />,
    );

    const links = getAllByRole("link");
    expect(links).toHaveLength(2);

    fireEvent.press(links[0]);
    fireEvent.press(links[1]);
    expect(Linking.openURL).toHaveBeenCalledWith("https://uniswap.org/terms-of-service");
    expect(Linking.openURL).toHaveBeenCalledWith("https://uniswap.org/privacy-policy");
  });

  it("should resolve Uniswap from the newer Universal Router address (mixed case)", () => {
    const { getAllByRole } = render(
      <TermsAndConditionsFooter
        manifestId="swap-live-app"
        manifestName="Swap"
        recipient={UNISWAP_UNIVERSAL_ROUTER_V2}
      />,
    );

    const links = getAllByRole("link");
    expect(links).toHaveLength(2);

    fireEvent.press(links[0]);
    fireEvent.press(links[1]);
    expect(Linking.openURL).toHaveBeenCalledWith("https://uniswap.org/terms-of-service");
    expect(Linking.openURL).toHaveBeenCalledWith("https://uniswap.org/privacy-policy");
  });

  it("should fall back to the manifest id when no recipient matches a DEX router", () => {
    const { getAllByRole } = render(
      <TermsAndConditionsFooter manifestId="paraswap" manifestName="ParaSwap" />,
    );

    const links = getAllByRole("link");
    expect(links).toHaveLength(1);

    fireEvent.press(links[0]);
    expect(Linking.openURL).toHaveBeenCalledWith("https://paraswap.io/tos");
  });

  it("should render nothing when neither the recipient nor the manifest resolves terms of use", () => {
    const { queryByTestId, queryAllByRole } = render(
      <TermsAndConditionsFooter manifestId="swap-live-app" manifestName="Swap" />,
    );

    expect(queryByTestId("wallet-api-signature-terms")).toBeNull();
    expect(queryAllByRole("link")).toHaveLength(0);
  });
});

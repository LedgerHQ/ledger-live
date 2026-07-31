import React from "react";
import { Linking } from "react-native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen } from "@tests/test-renderer";
import { i18n } from "~/context/Locale";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import AddressTypeTooltip from ".";

const bitcoin = getCryptoCurrencyById("bitcoin");

describe("AddressTypeTooltip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens the drawer, lists the schemes and exposes the bitcoin learn-more action", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);

    const { user } = render(
      <AddressTypeTooltip accountSchemes={["native_segwit"]} currency={bitcoin} />,
    );

    await user.press(screen.getByText(i18n.t("addAccounts.scanDeviceAccounts.whichAddressType")));

    const subtitle = await screen.findByText(i18n.t("addAccounts.addressTypeInfo.subtitle"));
    expect(subtitle).toBeVisible();
    expect(
      screen.getByText(i18n.t("addAccounts.addressTypeInfo.native_segwit.title")),
    ).toBeVisible();

    await user.press(screen.getByText(i18n.t("common.learnMore")));

    expect(track).toHaveBeenCalledWith("AddAccountsSupportLink_AddressType");
    expect(openURL).toHaveBeenCalledWith(urls.bitcoinAddressType);
  });

  it("does not render the learn-more button for non-bitcoin currencies", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const { user } = render(<AddressTypeTooltip accountSchemes={[""]} currency={ethereum} />);

    await user.press(screen.getByText(i18n.t("addAccounts.scanDeviceAccounts.whichAddressType")));

    await screen.findByText(i18n.t("addAccounts.addressTypeInfo.subtitle"));
    expect(screen.queryByText(i18n.t("common.learnMore"))).toBeNull();
  });
});

import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { urls } from "~/utils/urls";
import Modal from "./Modal";

const makeToken = (tokenType: string) => ({ type: "TokenCurrency", tokenType }) as Currency;

describe("OperationDetails Modal", () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => {
    openURL.mockRestore();
  });

  it("opens the support link of the token standard on learn more", async () => {
    const { user } = render(<Modal isOpened onClose={jest.fn()} currency={makeToken("vip180")} />);

    await user.press(screen.getByText("Learn more"));

    expect(openURL).toHaveBeenCalledWith(urls.supportLinkByTokenType.vip180);
  });

  it("opens the erc20 support link for a crypto currency on learn more", async () => {
    const { user } = render(
      <Modal isOpened onClose={jest.fn()} currency={getCryptoCurrencyById("ethereum")} />,
    );

    await user.press(screen.getByText("Learn more"));

    expect(openURL).toHaveBeenCalledWith(urls.supportLinkByTokenType.erc20);
  });

  it("hides learn more when the token standard has no support link", () => {
    render(<Modal isOpened onClose={jest.fn()} currency={makeToken("unlisted")} />);

    expect(screen.getByText("Close")).toBeOnTheScreen();
    expect(screen.queryByText("Learn more")).toBeNull();
  });
});

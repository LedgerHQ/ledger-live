/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { AmountMessageText } from "../AmountMessageText";

function createNotEnoughGasError(): Error {
  const error = new Error("");
  error.name = "NotEnoughGas";

  return Object.assign(error, {
    fees: "0.000005",
    ticker: "SOL",
    cryptoName: "Solana",
    links: ["ledgerlive://buy?account=solana-account"],
  });
}

function createTronEmptyAccountError(): Error {
  const error = new Error("");
  error.name = "TronEmptyAccount";

  return Object.assign(error, {
    links: ["https://support.ledger.com/article/6516823445533-zd"],
  });
}

describe("AmountMessageText", () => {
  it("renders buy links from bridge error links instead of exposing i18n tags", async () => {
    const onLinkPress = jest.fn();
    const { user } = render(
      <AmountMessageText
        message={{
          type: "error",
          text: "You need 0.000005 SOL <link0>Buy SOL</link0>",
          error: createNotEnoughGasError(),
        }}
        onLinkPress={onLinkPress}
      />,
    );

    const message = screen.getByTestId("send-amount-message");

    expect(message).toHaveTextContent(
      "You need 0.000005 SOL in your account to pay for transaction fees on the Solana network.",
    );
    expect(message).not.toHaveTextContent("<link0>");
    expect(message).not.toHaveClass("underline");
    expect(screen.getByTestId("send-amount-message-link-0")).toHaveTextContent("Buy SOL");
    expect(screen.getByTestId("send-amount-message-link-0")).toHaveClass("underline");
    expect(screen.queryByText("Learn more")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("send-amount-message-link-0"));

    expect(onLinkPress).toHaveBeenCalledWith("ledgerlive://buy?account=solana-account");
  });

  it("renders learn more links from bridge error links", async () => {
    const onLinkPress = jest.fn();
    const { user } = render(
      <AmountMessageText
        message={{
          type: "error",
          text: "Fallback <link0>Learn more</link0>",
          error: createTronEmptyAccountError(),
        }}
        onLinkPress={onLinkPress}
      />,
    );

    const message = screen.getByTestId("send-amount-message");

    expect(message).toHaveTextContent(
      "You first need to send at least 0.1 TRX to this address to enable TRC20 token reception.",
    );
    expect(message).not.toHaveTextContent("<link0>");
    expect(screen.getByTestId("send-amount-message-link-0")).toHaveTextContent("Learn more");
    expect(screen.getByTestId("send-amount-message-link-0")).toHaveClass("underline");

    await user.click(screen.getByTestId("send-amount-message-link-0"));

    expect(onLinkPress).toHaveBeenCalledWith("https://support.ledger.com/article/6516823445533-zd");
  });
});

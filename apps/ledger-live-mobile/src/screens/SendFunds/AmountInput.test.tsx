import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { TransferFeeCalculated } from "@ledgerhq/live-common/families/solana/types";
import AmountInput from "./AmountInput";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

describe("AmountInput", () => {
  it("displays a warning when the token embeds the transfer fee extension", () => {
    render(
      <AmountInput
        account={
          {
            type: "TokenAccount",
            token: {
              units: [{ code: "FAKE", magnitude: 8 }],
            },
          } as unknown as AccountLike
        }
        onChange={() => {}}
        value={new BigNumber(0)}
        transferFeeCalculated={{ transferFee: 500 } as unknown as TransferFeeCalculated}
      />,
    );

    expect(screen.queryByTestId("solana-token-transfer-fees-hint")).toHaveTextContent(
      "Token transfer fee: 0.000005 FAKE",
    );
  });

  it("does not display any warning when the token does not embed the transfer fee extension", () => {
    render(
      <AmountInput
        account={
          {
            type: "TokenAccount",
            token: {
              units: [{ code: "FAKE", magnitude: 8 }],
            },
          } as unknown as AccountLike
        }
        onChange={() => {}}
        value={new BigNumber(0)}
      />,
    );

    expect(screen.queryByTestId("solana-token-transfer-fees-hint")).toBeNull();
  });
});

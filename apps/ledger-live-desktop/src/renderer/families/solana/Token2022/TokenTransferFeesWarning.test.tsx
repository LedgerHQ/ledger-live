import React from "react";
import { render, screen } from "tests/testSetup";
import TokenTransferFeesWarning from "./TokenTransferFeesWarning";
import { Transaction, SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";

describe("TokenTransferFeesWarning", () => {
  it("displays a warning when the token embeds the transfer fee extension", () => {
    render(
      <TokenTransferFeesWarning
        tokenAccount={
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            token: {
              units: [{ code: "FAKE", magnitude: 8 }],
            },
          } as unknown as SolanaTokenAccount
        }
        transaction={{ transferFee: { feeBps: 100, transferFee: 500 } } as Transaction}
      />,
    );

    expect(screen.queryByTestId("solana-token-transfer-fees-hint")).toHaveTextContent(
      "Token transfer fee: 0.000005 FAKE",
    );
  });

  it("does not display any warning when the token does not embed the transfer fee extension", () => {
    render(
      <TokenTransferFeesWarning
        tokenAccount={
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          {
            token: {
              units: [{ code: "FAKE", magnitude: 8 }],
            },
          } as unknown as SolanaTokenAccount
        }
        transaction={{} as Transaction}
      />,
    );

    expect(screen.queryByTestId("solana-token-transfer-fees-hint")).toBeNull();
  });
});

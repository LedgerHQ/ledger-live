import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import SolanaFeeRow from "./SendRowsFee";
import { AccountLike } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/solana/types";
import { NotEnoughGas } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";

describe("SolanaFeeRow", () => {
  it("renders a warning if the transaction status contains an error", async () => {
    render(
      <SolanaFeeRow
        account={{ type: "Account", currency: { units: [] } } as unknown as AccountLike}
        transaction={{} as unknown as Transaction}
        status={
          {
            errors: {
              fee: new NotEnoughGas(undefined, {
                fees: new BigNumber(0.0002),
                ticker: "SOL",
                cryptoName: "Solana",
                links: ["http://buy.com"],
              }),
            },
          } as unknown as TransactionStatus
        }
      />,
    );
    expect(screen.getByTestId("insufficient-fee-error")).toHaveTextContent(
      "You need 0.0002 SOL in your account to pay for transaction fees on the Solana network.  Buy SOL or deposit more into your account.",
    );
  });

  it("does not render a warning if the transaction status does not contain any error", async () => {
    render(
      <SolanaFeeRow
        account={{ type: "Account", currency: { units: [] } } as unknown as AccountLike}
        transaction={{} as unknown as Transaction}
        status={
          {
            errors: {},
          } as unknown as TransactionStatus
        }
      />,
    );
    expect(screen.queryByTestId("insufficient-fee-error")).toBeNull();
  });
});

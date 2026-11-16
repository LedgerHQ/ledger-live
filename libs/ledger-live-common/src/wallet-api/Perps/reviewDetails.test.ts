import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getPerpsDepositReviewDetails } from "./reviewDetails";

const ethereum = getCryptoCurrencyById("ethereum");
const depositAccount = genAccount("funding-1", { currency: ethereum, operationsSize: 0 });
const receiverAccount = genAccount("receiver-1", { currency: ethereum, operationsSize: 0 });

function details() {
  return getPerpsDepositReviewDetails(
    { depositAccount, receiverAccount, amountSent: "0.02", amountTo: "0.019" },
    { locale: "en", receiverAccountName: "Hyperliquid 1", formatApproximate: value => `~${value}` },
  );
}

describe("getPerpsDepositReviewDetails", () => {
  it("shows the sent amount and the estimated received amount", () => {
    const [sent, received] = details().swapDetails;

    expect(sent).toEqual(expect.objectContaining({ labelKey: "perpsReview.amountSendLabel" }));
    expect(sent.value).toMatch(/^0\.02[\s ]ETH$/);
    expect(received).toEqual(
      expect.objectContaining({ labelKey: "perpsReview.amountReceiveLabel" }),
    );
    expect(received.value).toMatch(/^~0\.019[\s ]ETH$/);
  });

  it("shows the estimated deposit and the receiver account", () => {
    const [deposited, receiver] = details().depositDetails;

    expect(deposited.value).toMatch(/^~0\.019[\s ]ETH$/);
    expect(receiver).toEqual({
      labelKey: "perpsReview.depositReceiveLabel",
      value: "Hyperliquid 1",
      testID: "perps-deposit-receiver-account",
    });
  });
});

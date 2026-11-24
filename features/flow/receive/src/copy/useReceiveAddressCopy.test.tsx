import { renderHook } from "@testing-library/react";
import { receiveTestWrapper } from "../__tests__/receiveTestStore";
import { useReceiveAddressCopy } from "./useReceiveAddressCopy";

describe("useReceiveAddressCopy", () => {
  it("should name the asset received and its network", () => {
    const { result } = renderHook(
      () => useReceiveAddressCopy({ assetTicker: "USDC", networkName: "Ethereum" }),
      { wrapper: receiveTestWrapper() },
    );

    expect(result.current).toEqual({
      title: "Receive USDC",
      networkLabel: "Ethereum network",
      closeLabel: "Close",
      backLabel: "Back",
      selectAddressTitle: "Select address",
      addressOptionLabels: { transparent: "Public address", shielded: "Private address" },
      errorTitle: "We couldn't load this address",
      errorDescription: "Check your internet connection, then try again.",
      retryLabel: "Retry",
      copyLabel: "Copy",
      copiedLabel: "Copied",
      shareLabel: "Share",
      verifyLabel: "Verify",
      verifyHintMessage: "Verify your address on your Ledger device before sharing",
      verifyHintGotIt: "Got it",
      noticeTexts: {
        utxo: "For privacy reasons, a new address is generated after each transaction. The previous ones remain valid.",
        taproot: "Make sure the sender supports Taproot addresses before sending.",
        dashStaking: "Don't use this address to receive staking rewards.",
        tronInactiveAccount: "Send at least 0.1 TRX to this address first to activate it.",
        tezosDelegation:
          "Funds received on a delegated account are added to the staked amount. Choose another account if you want to avoid this.",
        zcashPrivateNotEnabled:
          "Private (shielded) receiving isn't enabled on this account yet. Enable it from the account page to get a private address.",
        unverifiableAddress:
          "Your Ledger device can't display this address. Check it on the explorer before sharing it.",
      },
      learnMoreLabel: "Learn more",
      serviceWarningCta: "See details",
      serviceStatusTitle: "Service incident",
      gotItLabel: "Got it",
    });
  });
});

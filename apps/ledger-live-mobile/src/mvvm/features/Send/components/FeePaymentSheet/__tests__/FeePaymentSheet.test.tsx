import React from "react";
import { act, fireEvent, render, screen } from "@tests/test-renderer";
import { BigNumber } from "bignumber.js";
import { FeePaymentSheet } from "..";

type SheetProps = Readonly<{ children: React.ReactNode; onClose?: () => void }>;
const mockSheet: { props: SheetProps | null } = { props: null };

// Like gorhom's portal, the sheet hands its content to a host outside the tree that renders it.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
    BottomSheet: (props: SheetProps) => {
      mockSheet.props = props;
      return null;
    },
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    BottomSheetHeader: ({ title }: { title: string }) => <RN.Text>{title}</RN.Text>,
  };
});
// Throws outside its provider, like the real context.
jest.mock("../../../context/SponsoredSendContext", () => {
  const { createContext, useContext } = jest.requireActual<typeof import("react")>("react");
  const MockSponsoredSendContext = createContext<unknown>(null);
  return {
    STANDARD_FEE_OPTION_ID: "standard",
    MockSponsoredSendContext,
    useSponsoredSend: () => {
      const value = useContext(MockSponsoredSendContext);
      if (!value) throw new Error("useSponsoredSend must be used within a SponsoredSendProvider");
      return value;
    },
  };
});
jest.mock("../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: () => ({ flowSessionId: "session-1" }),
}));
jest.mock("../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: () => ({}),
}));
jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://support.ledger.com/",
}));

const { MockSponsoredSendContext } = jest.requireMock<{
  MockSponsoredSendContext: React.Context<unknown>;
}>("../../../context/SponsoredSendContext");

const selectSponsored = jest.fn();
const sheetRef = { current: { present: jest.fn(), dismiss: jest.fn() } };

const sponsoredSend = {
  mainAccount: { currency: { ticker: "TRX" } },
  selectedFeeOptionId: "standard",
  sponsoredFeeOptionId: "tronify",
  providerName: "Tronify",
  selectSponsored,
  selectStandard: jest.fn(),
  sponsoredFeeAmounts: null,
  feeCurrencyTicker: "USDT",
  feeTokenAccount: { id: "usdt" },
  sponsoredMaxAmount: new BigNumber(6_768_000),
};

function renderSheet() {
  render(
    <MockSponsoredSendContext.Provider value={sponsoredSend}>
      <FeePaymentSheet sheetRef={sheetRef as never} />
    </MockSponsoredSendContext.Provider>,
  );
  // Mounted on its own, as the portal host does.
  return render(<>{mockSheet.props?.children}</>);
}

describe("FeePaymentSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSheet.props = null;
  });

  it("renders its content outside the send-flow providers, where the portal mounts it", () => {
    renderSheet();

    expect(screen.getByTestId("send-fee-payment-option-tronify")).toBeOnTheScreen();
    expect(screen.getByTestId("send-fee-payment-option-standard")).toBeSelected();
  });

  it("applies the pick and closes once it is confirmed", () => {
    const { rerender } = renderSheet();
    fireEvent.press(screen.getByTestId("send-fee-payment-option-tronify"));
    rerender(<>{mockSheet.props?.children}</>);

    fireEvent.press(screen.getByTestId("send-fee-payment-confirm"));

    expect(selectSponsored).toHaveBeenCalledTimes(1);
    expect(sheetRef.current.dismiss).toHaveBeenCalledTimes(1);
  });

  it("drops an unconfirmed pick when it closes", () => {
    const { rerender } = renderSheet();
    fireEvent.press(screen.getByTestId("send-fee-payment-option-tronify"));
    rerender(<>{mockSheet.props?.children}</>);
    expect(screen.getByTestId("send-fee-payment-option-tronify")).toBeSelected();

    act(() => mockSheet.props?.onClose?.());
    rerender(<>{mockSheet.props?.children}</>);

    expect(screen.getByTestId("send-fee-payment-option-standard")).toBeSelected();
    expect(selectSponsored).not.toHaveBeenCalled();
  });
});

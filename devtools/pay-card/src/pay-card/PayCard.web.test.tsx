import { render, screen, fireEvent } from "@testing-library/react";
import PayCard from "./PayCard";
import type { PayCardToolProps } from "../types";

function buildProps(): PayCardToolProps {
  return {
    flags: {
      payTabEnabled: false,
      cardParam: false,
      ptxCardEnabled: false,
      setPayTabEnabled: jest.fn(),
      setCardParam: jest.fn(),
      setPtxCardEnabled: jest.fn(),
    },
    onboarding: {
      steps: [
        {
          id: "step1",
          label: "Step 1",
          done: false,
        },
      ],
      setStepDone: jest.fn(),
    },
    cardOnboarding: {
      steps: [],
      completedCount: 0,
      isFetching: false,
      error: undefined,
      raw: "{}",
      refresh: jest.fn(),
      setStepDone: jest.fn(),
      clearMocks: jest.fn(),
      isMockingEnabled: true,
    },
    interaction: {
      probes: [],
      details: {
        imageUrl: undefined,
        isFetching: false,
        error: undefined,
        request: jest.fn(),
        clear: jest.fn(),
      },
    },
    balance: {
      baanxWallets: [],
      linkedWallets: [],
      combinedWallets: [],
      isFetching: false,
      errors: [],
      load: jest.fn(),
      refresh: jest.fn(),
    },
    hasSeenFeatureTour: false,
    resetPayCardFeatureTourSeen: jest.fn(),
    hasSeenReceiveVerifyHint: false,
    resetReceiveVerifyHintSeen: jest.fn(),
    hasSeenLoginIntro: false,
    resetPayCardLoginIntroSeen: jest.fn(),
    hasCompletedCardOnboarding: false,
    resetCardOnboarding: jest.fn(),
  };
}

describe("PayCard (web)", () => {
  it("renders every section", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.getByText("Feature flags")).toBeDefined();
    expect(screen.getByText("Onboarding")).toBeDefined();
    expect(screen.getByText("Feature tour")).toBeDefined();
    expect(screen.getByText("Request verify hint")).toBeDefined();
    expect(screen.getByText("Card login intro")).toBeDefined();
  });

  it("resets the feature tour", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Reset feature tour"));
    expect(props.resetPayCardFeatureTourSeen).toHaveBeenCalledTimes(1);
  });

  it("resets the request verify hint", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Reset verify hint"));
    expect(props.resetReceiveVerifyHintSeen).toHaveBeenCalledTimes(1);
  });

  it("hides quick actions when the host does not pass navigation", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.queryByText("Quick actions")).toBeNull();
  });

  it("navigates to Portfolio and Pay when the host wires the actions", () => {
    const onNavigateToPortfolio = jest.fn();
    const onNavigateToPayTab = jest.fn();
    const onNavigateToPaySuccess = jest.fn();
    const onNavigateToSendSuccess = jest.fn();
    render(
      <PayCard
        {...buildProps()}
        onNavigateToPortfolio={onNavigateToPortfolio}
        onNavigateToPayTab={onNavigateToPayTab}
        onNavigateToPaySuccess={onNavigateToPaySuccess}
        onNavigateToSendSuccess={onNavigateToSendSuccess}
      />,
    );

    expect(screen.getByText("Quick actions")).toBeDefined();
    fireEvent.click(screen.getByText("Go to Portfolio"));
    fireEvent.click(screen.getByText("Go to Pay tab"));
    fireEvent.click(screen.getByText("Pay contact success"));
    fireEvent.click(screen.getByText("Send success"));
    expect(onNavigateToPortfolio).toHaveBeenCalledTimes(1);
    expect(onNavigateToPayTab).toHaveBeenCalledTimes(1);
    expect(onNavigateToPaySuccess).toHaveBeenCalledTimes(1);
    expect(onNavigateToSendSuccess).toHaveBeenCalledTimes(1);
  });

  it("resets the card login intro", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.click(screen.getByText("Reset card login intro"));
    expect(props.resetPayCardLoginIntroSeen).toHaveBeenCalledTimes(1);
    expect(props.resetPayCardFeatureTourSeen).not.toHaveBeenCalled();
  });

  it("wires onboarding actions", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    // Label is display-only; ToggleRow wires onChange on the Switch.
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[switches.length - 1]!);
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("step1", true);
  });
});

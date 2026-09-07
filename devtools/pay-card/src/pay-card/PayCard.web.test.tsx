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
    interaction: { probes: [] },
    hasSeenFeatureTour: false,
    resetPayCardFeatureTourSeen: jest.fn(),
    hasSeenReceiveVerifyHint: false,
    resetReceiveVerifyHintSeen: jest.fn(),
    hasCompletedCardOnboarding: false,
    resetCardOnboarding: jest.fn(),
    env: {
      vars: [
        {
          key: "CARD_API_URL",
          value: "https://card.api.live.ledger.com",
          suggestedValue: "https://dev.api.baanx.com",
        },
        { key: "CARD_BAANX_CLIENT_KEY", value: "", suggestedValue: "dev-client-key" },
      ],
      setVar: jest.fn(),
    },
  };
}

describe("PayCard (web)", () => {
  it("renders every section", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.getByText("Feature flags")).toBeDefined();
    expect(screen.getByText("Onboarding")).toBeDefined();
    expect(screen.getByText("Feature tour")).toBeDefined();
    expect(screen.getByText("Request verify hint")).toBeDefined();
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
    render(
      <PayCard
        {...buildProps()}
        onNavigateToPortfolio={onNavigateToPortfolio}
        onNavigateToPayTab={onNavigateToPayTab}
      />,
    );

    expect(screen.getByText("Quick actions")).toBeDefined();
    fireEvent.click(screen.getByText("Go to Portfolio"));
    fireEvent.click(screen.getByText("Go to Pay tab"));
    expect(onNavigateToPortfolio).toHaveBeenCalledTimes(1);
    expect(onNavigateToPayTab).toHaveBeenCalledTimes(1);
  });

  it("shows both Card env vars, and the value the app reads now", () => {
    render(<PayCard {...buildProps()} />);

    expect(screen.getByText("Env vars")).toBeDefined();
    expect(screen.getByText("CARD_API_URL=https://card.api.live.ledger.com")).toBeDefined();
    // An empty client key must read as empty, and not as a missing row.
    expect(screen.getByText("CARD_BAANX_CLIENT_KEY=(empty)")).toBeDefined();
  });

  it("fills each input with the suggested value, so one click changes the tenant", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    const input = screen.getByLabelText("CARD_API_URL") as HTMLInputElement;
    expect(input.value).toBe("https://dev.api.baanx.com");

    fireEvent.click(screen.getAllByText("Set")[0]!);
    expect(props.env.setVar).toHaveBeenCalledWith("CARD_API_URL", "https://dev.api.baanx.com");
  });

  it("sets what the tester typed", () => {
    const props = buildProps();
    render(<PayCard {...props} />);

    fireEvent.change(screen.getByLabelText("CARD_API_URL"), {
      target: { value: "https://card.api.live.ledger.com" },
    });
    fireEvent.click(screen.getAllByText("Set")[0]!);

    expect(props.env.setVar).toHaveBeenCalledWith(
      "CARD_API_URL",
      "https://card.api.live.ledger.com",
    );
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

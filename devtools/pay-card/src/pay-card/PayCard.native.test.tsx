import { render, screen, userEvent } from "@support/jest-devtools/native";
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
    hasSeenFeatureTour: false,
    resetPayCardFeatureTourSeen: jest.fn(),
    hasSeenReceiveVerifyHint: false,
    resetReceiveVerifyHintSeen: jest.fn(),
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

describe("PayCard (native)", () => {
  it("renders every section", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.getByText("Feature flags")).toBeTruthy();
    expect(screen.getByText("Onboarding")).toBeTruthy();
    expect(screen.getByText("Feature tour")).toBeTruthy();
    expect(screen.getByText("Request verify hint")).toBeTruthy();
  });

  it("resets the feature tour", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    await user.press(screen.getByText("Reset feature tour"));
    expect(props.resetPayCardFeatureTourSeen).toHaveBeenCalledTimes(1);
  });

  it("resets the request verify hint", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    await user.press(screen.getByText("Reset verify hint"));
    expect(props.resetReceiveVerifyHintSeen).toHaveBeenCalledTimes(1);
  });

  it("hides quick actions when the host does not pass navigation", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.queryByText("Quick actions")).toBeNull();
  });

  it("navigates to Portfolio and Pay when the host wires the actions", async () => {
    const user = userEvent.setup();
    const onNavigateToPortfolio = jest.fn();
    const onNavigateToPayTab = jest.fn();
    render(
      <PayCard
        {...buildProps()}
        onNavigateToPortfolio={onNavigateToPortfolio}
        onNavigateToPayTab={onNavigateToPayTab}
      />,
    );

    expect(screen.getByText("Quick actions")).toBeTruthy();
    await user.press(screen.getByText("Go to Portfolio"));
    await user.press(screen.getByText("Go to Pay tab"));
    expect(onNavigateToPortfolio).toHaveBeenCalledTimes(1);
    expect(onNavigateToPayTab).toHaveBeenCalledTimes(1);
  });

  it("shows both Card env vars, and the value the app reads now", () => {
    render(<PayCard {...buildProps()} />);

    expect(screen.getByText("Env vars")).toBeTruthy();
    expect(screen.getByText("CARD_API_URL=https://card.api.live.ledger.com")).toBeTruthy();
    // An empty client key must read as empty, and not as a missing row.
    expect(screen.getByText("CARD_BAANX_CLIENT_KEY=(empty)")).toBeTruthy();
  });

  it("fills each input with the suggested value, so one press changes the tenant", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    expect(screen.getByTestId("pay-card-env-input-CARD_API_URL").props.value).toBe(
      "https://dev.api.baanx.com",
    );

    await user.press(screen.getAllByText("Set")[0]!);
    expect(props.env.setVar).toHaveBeenCalledWith("CARD_API_URL", "https://dev.api.baanx.com");
  });

  it("sets what the tester typed", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    const input = screen.getByTestId("pay-card-env-input-CARD_API_URL");
    await user.clear(input);
    await user.type(input, "https://card.api.live.ledger.com");
    await user.press(screen.getAllByText("Set")[0]!);

    expect(props.env.setVar).toHaveBeenCalledWith(
      "CARD_API_URL",
      "https://card.api.live.ledger.com",
    );
  });

  it("wires onboarding actions", async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<PayCard {...props} />);

    // Label is display-only; ToggleRow wires onChange on the Switch.
    const switches = screen.getAllByRole("switch");
    await user.press(switches[switches.length - 1]!);
    expect(props.onboarding.setStepDone).toHaveBeenCalledWith("step1", true);
  });
});

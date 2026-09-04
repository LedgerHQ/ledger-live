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
    interaction: { probes: [] },
    hasSeenFeatureTour: false,
    resetPayCardFeatureTourSeen: jest.fn(),
    hasSeenReceiveVerifyHint: false,
    resetReceiveVerifyHintSeen: jest.fn(),
  };
}

describe("PayCard (native)", () => {
  it("renders every section", () => {
    render(<PayCard {...buildProps()} />);
    expect(screen.getByText("Card Debug")).toBeTruthy();
    expect(screen.getByText("Card interaction")).toBeTruthy();
    expect(screen.getByText("Balance")).toBeTruthy();
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

  it("opens the interaction screen and runs a probe", async () => {
    const user = userEvent.setup();
    const run = jest.fn();
    const props = buildProps();
    render(
      <PayCard
        {...props}
        interaction={{
          probes: [
            {
              id: "card-status",
              label: "Card Status",
              isFetching: false,
              result: undefined,
              error: undefined,
              run,
            },
          ],
        }}
      />,
    );

    await user.press(screen.getByText("Card interaction"));
    // The tool swaps its whole body for the probes, so the flag rows are gone.
    expect(screen.queryByText("Feature flags")).toBeNull();

    // The probe names itself; there is no generic "Fetch".
    await user.press(screen.getByText("Card Status"));
    expect(run).toHaveBeenCalledTimes(1);

    await user.press(screen.getByText("Back"));
    expect(screen.getByText("Feature flags")).toBeTruthy();
  });

  it("shows what a probe came back with", async () => {
    const user = userEvent.setup();
    render(
      <PayCard
        {...buildProps()}
        interaction={{
          probes: [
            {
              id: "card-status",
              label: "Card Status",
              isFetching: false,
              result: '{ "status": "ACTIVE" }',
              error: undefined,
              run: jest.fn(),
            },
          ],
        }}
      />,
    );

    await user.press(screen.getByText("Card interaction"));

    expect(screen.getByText('{ "status": "ACTIVE" }')).toBeTruthy();
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

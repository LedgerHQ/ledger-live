import { render, screen, fireEvent } from "@testing-library/react";
import { CardOnboardingScreen } from "./CardOnboarding";

function buildProps(overrides = {}) {
  return {
    steps: [
      { id: "create-account", isDone: true, canToggle: true },
      { id: "first-purchase", isDone: false, canToggle: false },
    ],
    completedCount: 1,
    isFetching: false,
    error: undefined,
    raw: '{"steps":[]}',
    refresh: jest.fn(),
    setStepDone: jest.fn(),
    clearMocks: jest.fn(),
    isMockingEnabled: true,
    onBack: jest.fn(),
    ...overrides,
  };
}

describe("CardOnboarding (web)", () => {
  it("lists each step by id and says whether it is done", () => {
    render(<CardOnboardingScreen {...buildProps()} />);

    expect(screen.getByText("create-account")).toBeInTheDocument();
    expect(screen.getByText("first-purchase")).toBeInTheDocument();
    expect(screen.getByText("done")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("only offers a toggle for a step an endpoint answers", () => {
    render(<CardOnboardingScreen {...buildProps()} />);

    // `first-purchase` has no toggle: nothing answers it, so there is nothing to set.
    const toggles = screen.getAllByRole("switch");
    expect(toggles).toHaveLength(1);
    expect(screen.getByLabelText("create-account")).toBeInTheDocument();
  });

  it("sets the step the toggle names, to the value it was flipped to", () => {
    const props = buildProps();
    render(<CardOnboardingScreen {...props} />);

    // `create-account` is done, so flipping it asks for the answer behind it to read as not done.
    fireEvent.click(screen.getByLabelText("create-account"));

    expect(props.setStepDone).toHaveBeenCalledWith("create-account", false);
  });

  it("sets a step that is open to done", () => {
    const props = buildProps({
      steps: [{ id: "top-up-card", isDone: false, canToggle: true }],
      completedCount: 0,
    });
    render(<CardOnboardingScreen {...props} />);

    fireEvent.click(screen.getByLabelText("top-up-card"));

    expect(props.setStepDone).toHaveBeenCalledWith("top-up-card", true);
  });

  it("shows the derived answer itself, because the steps are worked out rather than fetched", () => {
    render(<CardOnboardingScreen {...buildProps()} />);

    expect(screen.getByText('{"steps":[]}')).toBeInTheDocument();
  });

  it("says why the steps cannot be set here when nothing mocks the endpoints", () => {
    render(<CardOnboardingScreen {...buildProps({ isMockingEnabled: false })} />);

    expect(screen.getByText(/ENABLE_MSW=true/)).toBeInTheDocument();
    expect(screen.queryByText("Use the real answers")).not.toBeInTheDocument();
  });

  it("hands the endpoints back when a developer asks for the real answers", () => {
    const props = buildProps();
    render(<CardOnboardingScreen {...props} />);

    fireEvent.click(screen.getByText("Use the real answers"));
    expect(props.clearMocks).toHaveBeenCalledTimes(1);
  });

  it("re-asks the sources, and returns to the tool", () => {
    const props = buildProps();
    render(<CardOnboardingScreen {...props} />);

    fireEvent.click(screen.getByLabelText("Refresh"));
    expect(props.refresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Back"));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("shows what failed instead of a half-read status", () => {
    render(<CardOnboardingScreen {...buildProps({ error: "401 unauthorized" })} />);

    expect(screen.getByText("401 unauthorized")).toBeInTheDocument();
  });
});

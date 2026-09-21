import { render, screen, fireEvent } from "@testing-library/react";
import { Interaction } from "./Interaction";

function buildDetails(overrides = {}) {
  return {
    imageUrl: undefined,
    isFetching: false,
    error: undefined,
    request: jest.fn(),
    clear: jest.fn(),
    ...overrides,
  };
}

const probes = [
  {
    id: "card-status",
    label: "Card Status",
    isFetching: false,
    result: undefined,
    error: undefined,
    run: jest.fn(),
  },
  {
    id: "freeze-card",
    label: "Freeze Card",
    isFetching: false,
    result: '{"status":"FROZEN"}',
    error: undefined,
    run: jest.fn(),
  },
];

describe("Interaction (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs the probe a developer presses, and shows what it answered", () => {
    const details = buildDetails();
    render(<Interaction probes={probes} details={details} onBack={jest.fn()} />);

    fireEvent.click(screen.getByText("Card Status"));

    expect(probes[0]!.run).toHaveBeenCalledTimes(1);
    expect(probes[1]!.run).not.toHaveBeenCalled();
    expect(screen.getByText('{"status":"FROZEN"}')).toBeInTheDocument();
  });

  it("says which probe failed rather than showing an empty result", () => {
    const failed = [
      {
        id: "card-status",
        label: "Card Status",
        isFetching: false,
        result: undefined,
        error: "401",
        run: jest.fn(),
      },
    ];
    render(<Interaction probes={failed} details={buildDetails()} onBack={jest.fn()} />);

    expect(screen.getByText("401")).toBeInTheDocument();
  });

  it("asks the provider to render the card, with colours for the current scheme", () => {
    const details = buildDetails();
    render(<Interaction probes={[]} details={details} onBack={jest.fn()} />);

    fireEvent.click(screen.getByText("Request Card Details"));

    // jsdom reports a light scheme, and the PAN strip sits a shade off the card body.
    expect(details.request).toHaveBeenCalledWith({
      cardBackgroundColor: "#f1f1f1",
      cardTextColor: "#000000",
      panBackgroundColor: "#ffffff",
      panTextColor: "#000000",
    });
  });

  it("asks for the dark colours when the window reports a dark scheme", () => {
    const matchMedia = jest.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const details = buildDetails();
    render(<Interaction probes={[]} details={details} onBack={jest.fn()} />);

    fireEvent.click(screen.getByText("Request Card Details"));

    expect(details.request).toHaveBeenCalledWith(
      expect.objectContaining({ cardBackgroundColor: "#1f1f1f", panBackgroundColor: "#000000" }),
    );
    matchMedia.mockRestore();
  });

  it("reads a window with no scheme to report as the light one", () => {
    const matchMedia = jest
      .spyOn(window, "matchMedia")
      .mockReturnValue(undefined as unknown as MediaQueryList);
    const details = buildDetails();
    render(<Interaction probes={[]} details={details} onBack={jest.fn()} />);

    fireEvent.click(screen.getByText("Request Card Details"));

    expect(details.request).toHaveBeenCalledWith(
      expect.objectContaining({ cardBackgroundColor: "#f1f1f1" }),
    );
    matchMedia.mockRestore();
  });

  it("says it is asking, and takes no second request while it is", () => {
    const details = buildDetails({ isFetching: true });
    render(<Interaction probes={[]} details={details} onBack={jest.fn()} />);

    const button = screen.getByText("Requesting…").closest("button");
    expect(button).toBeDisabled();

    fireEvent.click(button!);
    expect(details.request).not.toHaveBeenCalled();
  });

  it("shows the rendered card once the provider answers, and never the url as text", () => {
    const details = buildDetails({ imageUrl: "https://card.test/minted-once" });
    const { container } = render(<Interaction probes={[]} details={details} onBack={jest.fn()} />);

    expect(screen.getByAltText("Card details")).toHaveAttribute(
      "src",
      "https://card.test/minted-once",
    );
    expect(container.textContent).not.toContain("minted-once");
  });

  it("drops the minted url on the way back, so returning asks for a fresh one", () => {
    const details = buildDetails({ imageUrl: "https://card.test/minted-once" });
    const onBack = jest.fn();
    render(<Interaction probes={[]} details={details} onBack={onBack} />);

    fireEvent.click(screen.getByText("Back"));

    expect(details.clear).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

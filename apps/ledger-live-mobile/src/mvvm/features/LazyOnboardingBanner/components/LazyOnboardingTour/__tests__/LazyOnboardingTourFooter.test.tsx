import React from "react";
import { useSlidesContext } from "@ledgerhq/native-ui";
import { render, screen, userEvent } from "@tests/test-renderer";
import { LazyOnboardingTourFooter } from "../LazyOnboardingTourFooter";

jest.mock("@ledgerhq/native-ui", () => ({
  useSlidesContext: jest.fn(),
}));

const mockUseSlidesContext = jest.mocked(useSlidesContext);
const mockGoToNext = jest.fn();

function mockSlidesContext(currentIndex: number) {
  mockUseSlidesContext.mockReturnValue({
    currentIndex,
    goToNext: mockGoToNext,
    totalSlides: 4,
    scrollProgressSharedValue: { value: currentIndex },
  } as ReturnType<typeof useSlidesContext>);
}

describe("LazyOnboardingTourFooter", () => {
  const onContinue = jest.fn();
  const onBuy = jest.fn();
  const onDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show Continue and Buy on intermediate slides", () => {
    mockSlidesContext(1);

    render(<LazyOnboardingTourFooter onContinue={onContinue} onBuy={onBuy} onDone={onDone} />);

    expect(screen.getByTestId("lazy-onboarding-tour-primary-button")).toHaveTextContent("Continue");
    expect(screen.getByTestId("lazy-onboarding-tour-secondary-button")).toHaveTextContent(
      "Buy a Ledger device",
    );
  });

  it("should advance and track Continue on intermediate slides", async () => {
    mockSlidesContext(0);
    const user = userEvent.setup();

    render(<LazyOnboardingTourFooter onContinue={onContinue} onBuy={onBuy} onDone={onDone} />);

    await user.press(screen.getByTestId("lazy-onboarding-tour-primary-button"));

    expect(onContinue).toHaveBeenCalledWith(0);
    expect(mockGoToNext).toHaveBeenCalledTimes(1);
    expect(onBuy).not.toHaveBeenCalled();
  });

  it("should call Buy from the secondary button on intermediate slides", async () => {
    mockSlidesContext(2);
    const user = userEvent.setup();

    render(<LazyOnboardingTourFooter onContinue={onContinue} onBuy={onBuy} onDone={onDone} />);

    await user.press(screen.getByTestId("lazy-onboarding-tour-secondary-button"));

    expect(onBuy).toHaveBeenCalledWith(2);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("should show Done primary and Buy secondary on the last slide", () => {
    mockSlidesContext(3);

    render(<LazyOnboardingTourFooter onContinue={onContinue} onBuy={onBuy} onDone={onDone} />);

    expect(screen.getByTestId("lazy-onboarding-tour-primary-button")).toHaveTextContent("Done");
    expect(screen.getByTestId("lazy-onboarding-tour-secondary-button")).toHaveTextContent(
      "Buy a Ledger device",
    );
  });

  it("should call Done from the primary button on the last slide", async () => {
    mockSlidesContext(3);
    const user = userEvent.setup();

    render(<LazyOnboardingTourFooter onContinue={onContinue} onBuy={onBuy} onDone={onDone} />);

    await user.press(screen.getByTestId("lazy-onboarding-tour-primary-button"));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("should call Buy from the secondary button on the last slide", async () => {
    mockSlidesContext(3);
    const user = userEvent.setup();

    render(<LazyOnboardingTourFooter onContinue={onContinue} onBuy={onBuy} onDone={onDone} />);

    await user.press(screen.getByTestId("lazy-onboarding-tour-secondary-button"));

    expect(onBuy).toHaveBeenCalledWith(3);
    expect(onDone).not.toHaveBeenCalled();
  });
});

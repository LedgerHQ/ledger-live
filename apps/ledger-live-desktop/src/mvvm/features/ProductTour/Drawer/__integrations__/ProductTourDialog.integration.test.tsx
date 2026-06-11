import React from "react";
import { fireEvent, render, screen, waitFor } from "tests/testSetup";
import { ProductTourDialog } from "../ProductTourDialogView";
import { useProductTourDialogViewModel } from "../hooks/useProductTourDialogViewModel";

const CONTINUE_LABEL = "Continue";
const DONE_LABEL = "Done";
const FUND_LABEL = "Fund your wallet";
const PORTFOLIO_LABEL = "View your portfolio";
const STAKE_LABEL = "Discover Earn";
const CARD_LABEL = "Get a card";
const SWAP_LABEL = "Discover Swap";

const mockNavigate = jest.fn();
const mockOpenAssetFlow = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({
    openAssetFlow: mockOpenAssetFlow,
  }),
}));

function TestHarness() {
  const { openDialog, ...productTourDialogViewModel } = useProductTourDialogViewModel();
  return (
    <div>
      <button type="button" onClick={openDialog}>
        Open
      </button>
      <ProductTourDialog {...productTourDialogViewModel} />
    </div>
  );
}

function getProductTourTestInitialState(overrides?: { productTourCompleted?: boolean }) {
  return {
    settings: {
      productTourCompleted: overrides?.productTourCompleted ?? false,
    },
  };
}

function completeSlideOutAnimation(fromIndex: number) {
  const slideOutAnimationStart = new Event("animationstart", {
    bubbles: true,
  });
  Object.defineProperty(slideOutAnimationStart, "animationName", {
    value: "slide-out-to-left",
  });

  fireEvent(screen.getByTestId(`product-tour-slide-${fromIndex}`), slideOutAnimationStart);
}

async function goToNextSlide(user: ReturnType<typeof render>["user"], fromIndex: number) {
  await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
  completeSlideOutAnimation(fromIndex);
}

describe("ProductTourDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render dialog with first slide content", () => {
    const onClose = jest.fn();
    render(
      <ProductTourDialog
        isOpen
        onClose={onClose}
        onDismiss={jest.fn()}
        onComplete={jest.fn()}
        onPrimaryAction={jest.fn()}
        onSlideChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByText("Start by funding your wallet")).toBeVisible();
    expect(
      screen.getByText(
        "Fund your Ledger Wallet your way — transfer, buy, or convert cash to stablecoins.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: FUND_LABEL })).toBeVisible();
    expect(screen.getByRole("button", { name: CONTINUE_LABEL })).toBeVisible();
  });

  it("should show fifth slide after four continue taps", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <ProductTourDialog
        isOpen
        onClose={onClose}
        onDismiss={jest.fn()}
        onComplete={jest.fn()}
        onPrimaryAction={jest.fn()}
        onSlideChange={jest.fn()}
      />,
    );

    await goToNextSlide(user, 0);
    await goToNextSlide(user, 1);
    await goToNextSlide(user, 2);
    await goToNextSlide(user, 3);

    expect(await screen.findByTestId("product-tour-slide-4")).toBeVisible();
    expect(screen.getByRole("button", { name: SWAP_LABEL })).toBeVisible();
    expect(screen.getByRole("button", { name: DONE_LABEL })).toBeVisible();
  });

  it("should call onClose when clicking close", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <ProductTourDialog
        isOpen
        onClose={onClose}
        onDismiss={jest.fn()}
        onComplete={jest.fn()}
        onPrimaryAction={jest.fn()}
        onSlideChange={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("ProductTour dialog from debug (view model)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open dialog when clicking open from debug", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });
  });

  it("should reset to first slide on each open", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));

    expect(await screen.findByRole("button", { name: PORTFOLIO_LABEL })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /open/i }));

    expect(await screen.findByRole("button", { name: FUND_LABEL })).toBeVisible();
    expect(screen.getByTestId("product-tour-slide-0")).toBeVisible();
  });

  it("should mark product tour completed when reaching the fifth slide", async () => {
    const { user, store } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    expect(screen.getByTestId("product-tour-slide-0")).toBeVisible();

    await goToNextSlide(user, 0);
    await goToNextSlide(user, 1);
    await goToNextSlide(user, 2);
    await goToNextSlide(user, 3);

    expect(await screen.findByTestId("product-tour-slide-4")).toBeVisible();
    expect(store.getState().settings.productTourCompleted).toBe(true);

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(store.getState().settings.productTourCompleted).toBe(true);
  });

  it("should close dialog when clicking done on the last slide", async () => {
    const { user, store } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));

    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));

    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(store.getState().settings.productTourCompleted).toBe(true);

    await user.click(await screen.findByRole("button", { name: DONE_LABEL }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(store.getState().settings.productTourCompleted).toBe(true);
  });

  it("should close dialog and open fund flow when clicking the first primary cta", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(screen.getByRole("button", { name: FUND_LABEL }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
  });

  it("should navigate to portfolio when clicking the second primary cta", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(await screen.findByRole("button", { name: PORTFOLIO_LABEL }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("should navigate to earn page when clicking the stake primary cta", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(await screen.findByRole("button", { name: STAKE_LABEL }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/earn");
  });

  it("should navigate to card page when clicking the card primary cta", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(await screen.findByRole("button", { name: CARD_LABEL }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/card");
  });

  it("should navigate to swap when clicking the last primary cta", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    await user.click(await screen.findByRole("button", { name: SWAP_LABEL }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockNavigate).toHaveBeenCalledWith("/swap");
  });

  it("should not clear productTourCompleted when dismissing after opening from debug", async () => {
    const { user, store } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState({ productTourCompleted: true }),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(store.getState().settings.productTourCompleted).toBe(true);
  });
});

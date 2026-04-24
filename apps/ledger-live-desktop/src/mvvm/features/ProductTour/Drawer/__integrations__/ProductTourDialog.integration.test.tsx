import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { ProductTourDialog } from "../ProductTourDialog";
import { useProductTourDialogViewModel } from "../hooks/useProductTourDialogViewModel";

const PRODUCT_TOUR_KEYS = {
  ctaContinue: "productTour.cta.continue",
} as const;

function TestHarness() {
  const { isDialogOpen, openDialog, closeDialog, onSlideChange } = useProductTourDialogViewModel();

  return (
    <div>
      <button type="button" onClick={openDialog}>
        Open
      </button>
      <ProductTourDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onSlideChange={onSlideChange}
      />
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

describe("ProductTourDialog", () => {
  it("should render dialog with first slide content", () => {
    const onClose = jest.fn();
    const { i18n } = render(
      <ProductTourDialog isOpen onClose={onClose} onSlideChange={jest.fn()} />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: i18n.t(PRODUCT_TOUR_KEYS.ctaContinue) }),
    ).toBeInTheDocument();
  });

  it("should show fourth slide after three continue taps", async () => {
    const onClose = jest.fn();
    const { user, i18n } = render(
      <ProductTourDialog isOpen onClose={onClose} onSlideChange={jest.fn()} />,
    );
    const continueLabel = i18n.t(PRODUCT_TOUR_KEYS.ctaContinue);

    await user.click(screen.getByRole("button", { name: continueLabel }));
    await user.click(screen.getByRole("button", { name: continueLabel }));
    await user.click(screen.getByRole("button", { name: continueLabel }));

    expect(await screen.findByTestId("product-tour-slide-3")).toBeInTheDocument();
  });

  it("should call onClose when clicking close", async () => {
    const onClose = jest.fn();
    const { user } = render(
      <ProductTourDialog isOpen onClose={onClose} onSlideChange={jest.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("ProductTour dialog from debug (view model)", () => {
  it("should open dialog when clicking open from debug", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should reach four slides, dismiss without marking product tour completed", async () => {
    const { user, store, i18n } = render(<TestHarness />, {
      initialState: getProductTourTestInitialState(),
    });

    await user.click(screen.getByRole("button", { name: /open/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.getByTestId("product-tour-slide-0")).toBeInTheDocument();

    const continueLabel = i18n.t(PRODUCT_TOUR_KEYS.ctaContinue);
    await user.click(screen.getByRole("button", { name: continueLabel }));
    await user.click(screen.getByRole("button", { name: continueLabel }));
    await user.click(screen.getByRole("button", { name: continueLabel }));

    expect(await screen.findByTestId("product-tour-slide-3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(store.getState().settings.productTourCompleted).toBe(false);
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

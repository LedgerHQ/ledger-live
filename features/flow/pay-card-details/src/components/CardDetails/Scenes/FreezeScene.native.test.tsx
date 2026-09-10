import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../../__tests__/i18nWrapper";
import { FreezeScene } from "./FreezeScene";
import type { FreezeViewModel } from "../../../types";

const viewModel: FreezeViewModel = {
  status: "ACTIVE",
  isActionDisabled: false,
  confirmState: "prompt",
  onOpenConfirm: jest.fn(),
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

function renderScene(overrides: Partial<FreezeViewModel> = {}) {
  return {
    user: userEvent.setup(),
    ...render(<FreezeScene viewModel={{ ...viewModel, ...overrides }} />, {
      wrapper: I18nWrapper,
    }),
  };
}

describe("FreezeScene (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing when confirmation is closed", () => {
    renderScene({ confirmState: "closed" });

    expect(screen.queryByTestId("card-details-freeze-content")).toBeNull();
  });

  it("should show freeze confirmation copy", () => {
    renderScene();

    expect(screen.getByText(CARD_COPY.freezeTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freezeDescription)).toBeVisible();
  });

  it("should call onConfirm from the confirm button", async () => {
    const { user } = renderScene();

    await user.press(screen.getByTestId("freeze-confirm-action"));

    expect(viewModel.onConfirm).toHaveBeenCalledTimes(1);
    expect(viewModel.onClose).not.toHaveBeenCalled();
  });

  it("should call onClose from go back", async () => {
    const { user } = renderScene();

    await user.press(screen.getByTestId("freeze-confirm-cancel"));

    expect(viewModel.onClose).toHaveBeenCalledTimes(1);
  });

  it("should disable both buttons while the request is in flight", () => {
    renderScene({ confirmState: "pending" });

    expect(screen.getByTestId("freeze-confirm-action").props.disabled).toBe(true);
    expect(screen.getByTestId("freeze-confirm-cancel").props.disabled).toBe(true);
  });

  it("should show freeze error copy when the request failed", () => {
    renderScene({ confirmState: "error" });

    expect(screen.getByText(CARD_COPY.freezeErrorTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.errorDescription)).toBeVisible();
  });

  it("should retry from the error view", async () => {
    const { user } = renderScene({ confirmState: "error" });

    await user.press(screen.getByTestId("freeze-confirm-action"));

    expect(viewModel.onConfirm).toHaveBeenCalledTimes(1);
  });
});

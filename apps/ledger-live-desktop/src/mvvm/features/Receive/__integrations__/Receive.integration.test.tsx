import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { ReceiveOptionsDialog } from "../screens/ReceiveOptions";
import { useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

describe("Receive feature integration", () => {
  const onClose = jest.fn();
  const onGoToAccount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  describe("ReceiveOptionsDialog", () => {
    it("renders dialog with Receive title and both options", () => {
      render(<ReceiveOptionsDialog onClose={onClose} onGoToAccount={onGoToAccount} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("receive-step-options")).toBeInTheDocument();
      expect(screen.getByTestId("receive-step-options-crypto")).toBeInTheDocument();
      expect(screen.getByTestId("receive-step-options-bank")).toBeInTheDocument();
    });

    it("calls onGoToAccount when user clicks crypto option", async () => {
      const { user } = render(
        <ReceiveOptionsDialog onClose={onClose} onGoToAccount={onGoToAccount} />,
      );

      await user.click(screen.getByTestId("receive-step-options-crypto"));

      expect(onGoToAccount).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "crypto",
        page: "receive_drawer",
      });
    });

    it("calls onClose and navigates to /bank when user clicks bank option", async () => {
      const { user } = render(
        <ReceiveOptionsDialog onClose={onClose} onGoToAccount={onGoToAccount} />,
      );

      await user.click(screen.getByTestId("receive-step-options-bank"));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/bank");
      expect(onGoToAccount).not.toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "fiat",
        page: "receive_drawer",
      });
    });

    it("calls onClose when user clicks close button", async () => {
      const { user } = render(
        <ReceiveOptionsDialog onClose={onClose} onGoToAccount={onGoToAccount} />,
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });
});

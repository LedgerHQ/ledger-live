import { useCallback } from "react";
import { useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";

export type UseReceiveOptionsViewModelArgs = Readonly<{
  onClose: () => void;
  onGoToAccount: () => void;
}>;

export function useReceiveOptionsViewModel({
  onClose,
  onGoToAccount,
}: UseReceiveOptionsViewModelArgs) {
  const navigate = useNavigate();

  const handleGoToBank = useCallback(() => {
    track("button_clicked", {
      button: "fiat",
      page: "receive_drawer",
    });
    onClose();
    navigate("/bank");
  }, [onClose, navigate]);

  const handleGoToCrypto = useCallback(() => {
    track("button_clicked", {
      button: "crypto",
      page: "receive_drawer",
    });
    onGoToAccount();
  }, [onGoToAccount]);

  return { handleGoToBank, handleGoToCrypto };
}

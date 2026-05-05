import { useCallback } from "react";
import { useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";

export type UseReceiveOptionsViewModelArgs = Readonly<{
  onClose: () => void;
  onGoToAccount: () => void;
  sourcePage: string;
}>;

export function useReceiveOptionsViewModel({
  onClose,
  onGoToAccount,
  sourcePage,
}: UseReceiveOptionsViewModelArgs) {
  const navigate = useNavigate();

  const handleGoToBank = useCallback(() => {
    track("button_clicked", {
      button: "fiat",
      page: sourcePage,
    });
    onClose();
    navigate("/bank");
  }, [onClose, navigate, sourcePage]);

  const handleGoToCrypto = useCallback(() => {
    track("button_clicked", {
      button: "crypto",
      page: sourcePage,
    });
    onGoToAccount();
  }, [onGoToAccount, sourcePage]);

  return { handleGoToBank, handleGoToCrypto };
}

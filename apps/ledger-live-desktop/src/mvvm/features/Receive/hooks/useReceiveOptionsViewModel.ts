import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";

export type UseReceiveOptionsViewModelArgs = Readonly<{
  onClose: () => void;
  onGoToAccount: () => void;
  sourcePage?: string;
}>;

export function useReceiveOptionsViewModel({
  onClose,
  onGoToAccount,
  sourcePage,
}: UseReceiveOptionsViewModelArgs) {
  const navigate = useNavigate();
  const location = useLocation();

  const page = sourcePage || location.pathname;

  const handleGoToBank = useCallback(() => {
    track("button_clicked", {
      button: "fiat",
      page,
    });
    onClose();
    navigate("/bank");
  }, [onClose, navigate, page]);

  const handleGoToCrypto = useCallback(() => {
    track("button_clicked", {
      button: "crypto",
      page,
    });
    onGoToAccount();
  }, [onGoToAccount, page]);

  return { handleGoToBank, handleGoToCrypto };
}

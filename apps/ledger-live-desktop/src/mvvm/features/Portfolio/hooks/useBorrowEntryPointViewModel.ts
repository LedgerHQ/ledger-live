import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";

export type BorrowEntryPointViewModel = {
  handleClick: () => void;
};

export function useBorrowEntryPointViewModel(): BorrowEntryPointViewModel {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = useCallback(() => {
    track("button_clicked", {
      button: "borrow_entry_point",
      flow: "borrow",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    navigate("/borrow", { state: { returnTo: location.pathname } });
  }, [navigate, location.pathname]);

  return {
    handleClick,
  };
}

import { useCallback } from "react";
import { useNavigate } from "react-router";
import { track } from "@shared/analytics";
import { usePayCardFace } from "LLD/components/RightPanel/Card/usePayCardFace";
import { CL_CARD_APP_ID } from "LLD/features/Card/constants";

export function usePayTabCardDisclaimer() {
  const navigate = useNavigate();
  const isVisible = usePayCardFace() === "disclaimer";

  // Same CL Card webview as "I have a card" on the Card screen.
  const openCardApp = useCallback(() => {
    track("button_clicked", { button: "go to cl card", page: "Pay" });
    navigate(`/card/${CL_CARD_APP_ID}`, { state: { fromPayTab: true } });
  }, [navigate]);

  return { isVisible, openCardApp };
}

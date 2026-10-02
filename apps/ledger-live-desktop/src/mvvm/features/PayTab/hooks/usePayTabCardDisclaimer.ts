import { useCallback } from "react";
import { useNavigate } from "react-router";
import { usePayCardFace } from "LLD/components/RightPanel/Card/usePayCardFace";
import { CL_CARD_APP_ID } from "LLD/features/Card/constants";

export function usePayTabCardDisclaimer() {
  const navigate = useNavigate();
  const isVisible = usePayCardFace() === "disclaimer";

  // Same CL Card webview as "I have a card" on the Card screen.
  const openCardApp = useCallback(
    () => navigate(`/card/${CL_CARD_APP_ID}`, { state: { fromPayTab: true } }),
    [navigate],
  );

  return { isVisible, openCardApp };
}

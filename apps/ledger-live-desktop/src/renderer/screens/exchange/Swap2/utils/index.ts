import { useCallback } from "react";
import { useNavigate } from "react-router";

export const SWAP_VERSION = "2.35";

const SWAP_TRACKING_PROPERTIES = {
  swapVersion: SWAP_VERSION,
  flow: "swap",
  live_app: "swap",
};

export const useGetSwapTrackingProperties = () => {
  return SWAP_TRACKING_PROPERTIES;
};

export const useRedirectToSwapHistory = () => {
  const navigate = useNavigate();
  return useCallback(
    ({
      swapId,
    }: {
      swapId?: string;
    } = {}) => {
      navigate("/swap/history", {
        state: {
          swapId,
        },
      });
    },
    [navigate],
  );
};

export const SELL_VERSION = "1.00";

const SELL_TRACKING_PROPERTIES = {
  swapVersion: SELL_VERSION,
  flow: "sell",
};

export const useGetSellTrackingProperties = () => {
  return SELL_TRACKING_PROPERTIES;
};

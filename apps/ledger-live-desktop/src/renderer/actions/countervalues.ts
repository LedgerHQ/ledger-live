export const fetchCountervaluesMarketcapIds = () => ({
  type: "FETCH_COUNTERVALUES_MARKETCAP_IDS" as const,
});

export const setCountervaluesMarketcapIds = (payload: string[]) => ({
  type: "SET_COUNTERVALUES_MARKETCAP_IDS" as const,
  payload,
});

export const setCountervaluesMarketcapLoading = (payload: boolean) => ({
  type: "SET_COUNTERVALUES_MARKETCAP_LOADING" as const,
  payload,
});

export const setCountervaluesMarketcapError = (payload: string) => ({
  type: "SET_COUNTERVALUES_MARKETCAP_ERROR" as const,
  payload,
});

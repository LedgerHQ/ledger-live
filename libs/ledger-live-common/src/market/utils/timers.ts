export const REFETCH_TIME_ONE_MINUTE = 60 * 1000;

export const BASIC_REFETCH = 3; // nb minutes

export function resolveMarketListRefreshRate(refreshTime: number | undefined): number {
  const minutes = Number(refreshTime);
  return minutes > 0 ? REFETCH_TIME_ONE_MINUTE * minutes : REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;
}

export const ONE_DAY = 24 * 60 * 60 * 1000;
export const HALF_DAY = ONE_DAY / 2;

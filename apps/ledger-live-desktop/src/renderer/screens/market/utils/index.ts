import { listItemHeight } from "../components/Table";

export const REFETCH_TIME_ONE_MINUTE = 60 * 1000;

export const BASIC_REFETCH = 3; // nb minutes

export const isDataStale = (lastUpdate: number, refreshRate: number) => {
  const currentTime = new Date();
  const updatedAt = new Date(lastUpdate);
  const elapsedTime = currentTime.getTime() - updatedAt.getTime();

  return elapsedTime > refreshRate;
};

export function getCurrentPage(scrollPosition: number, pageSize: number): number {
  const size = listItemHeight * pageSize;
  return Math.floor(scrollPosition / size) + 1;
}

export function formatPrice(price: number): number {
  return parseFloat(price.toFixed(price >= 1 ? 2 : 6));
}

export function formatPercentage(percentage: number, decimals = 2): number {
  return parseFloat(percentage.toFixed(decimals));
}

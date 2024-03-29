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

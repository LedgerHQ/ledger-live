import { GetNextPageParamFunction, InfiniteData, QueryFunction } from "@tanstack/react-query";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { mocks } from "./mocks/manifests";

const manifests = [
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
  ...mocks,
];

const MOCK_DELAY = 1000;

const PAGE_SIZE = 10;

export const fetchManifestsMock: (
  category: string,
  search: string,
) => QueryFunction<LiveAppManifest[], string[], number> =
  (category, search) =>
  async ({ pageParam }) => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    let list = manifests;

    if (search !== "") {
      list = list.filter(manifest => {
        return manifest.name.includes(search);
      });
    } else if (category !== "all") {
      list = list.filter(manifest => {
        return manifest.categories.includes(category);
      });
    }

    return list.slice((pageParam - 1) * PAGE_SIZE, pageParam * PAGE_SIZE);
  };

export const selectManifests = (data: InfiniteData<LiveAppManifest[], number>) => {
  return data.pages.flat(1);
};

export const getNextPageParam: GetNextPageParamFunction<number, LiveAppManifest[]> = (
  lastPage,
  allPages,
  lastPageParam,
) => {
  if (allPages.length === 0) {
    return undefined;
  }
  if (lastPage.length < PAGE_SIZE) {
    return undefined;
  }
  return lastPageParam + 1;
};

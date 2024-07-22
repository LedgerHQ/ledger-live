import network from "@ledgerhq/live-network/network";
import { GetNextPageParamFunction, InfiniteData, QueryFunction } from "@tanstack/react-query";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { manifests } from "./mocks/manifests";

const MOCK_DELAY = 1000;
const MOCK_BY_ID_DELAY = 300;

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

export const fetchManifests: (
  category: string,
  search: string,
) => QueryFunction<LiveAppManifest[], string[], number> =
  (category, search) =>
  async ({ pageParam }) => {
    const res = await network<LiveAppManifest[]>({
      url: `https://manifest-api-git-feat-v2-search-ledgerhq.vercel.app/api/v2/apps?resultsPerPage=${PAGE_SIZE}&page=${pageParam}&categories=${category === "all" ? "" : category}&search=${search}`,
    });
    return res.data;
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

export const fetchManifestByIdMock = (manifestId: string) => async () => {
  await new Promise(resolve => setTimeout(resolve, MOCK_BY_ID_DELAY));

  return manifests.find(mock => mock.id === manifestId);
};

export const fetchManifestById = (manifestId: string) => async () => {
  const res = await network<LiveAppManifest>({
    url: `https://manifest-api-git-feat-v2-search-ledgerhq.vercel.app/api/v2/apps/${manifestId}`,
  });
  return res.data;
};

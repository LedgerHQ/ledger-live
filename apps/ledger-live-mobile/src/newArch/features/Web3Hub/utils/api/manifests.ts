import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import network from "@ledgerhq/live-network/network";
import { GetNextPageParamFunction, InfiniteData, QueryFunction } from "@tanstack/react-query";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { URL_ORIGIN } from "LLM/features/Web3Hub/constants";
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

const PLATFORM = Platform.OS === "ios" ? "ios" : "android";
const LLVersion = VersionNumber.appVersion;

const apiVersions = ["1.0.0", "2.0.0"];

const defaultBranches = ["stable", "soon"];

type FetchManifests = (
  category: string,
  search: string,
  allowExperimentalApps: boolean,
  allowDebugApps: boolean,
  lang: string,
) => QueryFunction<LiveAppManifest[], string[], number>;

export const fetchManifests: FetchManifests = (
  category,
  search,
  allowExperimentalApps,
  allowDebugApps,
  lang,
) => {
  const url = new URL(`${URL_ORIGIN}/api/v2/apps`);
  url.searchParams.set("llVersion", LLVersion);
  url.searchParams.set("platform", PLATFORM);
  url.searchParams.set("private", "false");
  url.searchParams.set("lang", lang ? lang : "en");
  apiVersions.forEach(apiVersion => {
    url.searchParams.append("apiVersion", apiVersion);
  });
  const branches = [
    ...defaultBranches,
    allowExperimentalApps && "experimental",
    allowDebugApps && "debug",
  ];
  branches.forEach(branch => {
    if (branch) {
      url.searchParams.append("branches", branch);
    }
  });

  url.searchParams.set("resultsPerPage", `${PAGE_SIZE}`);
  if (category !== "all") {
    url.searchParams.set("categories", category);
  }
  // TODO: make sure to trim search
  if (search) {
    url.searchParams.set("search", search);
  }

  return async ({ pageParam }) => {
    url.searchParams.set("page", `${pageParam}`);

    const res = await network<LiveAppManifest[]>({
      url: url.toString(),
    });
    return res.data;
  };
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

export const fetchManifestById = (manifestId: string, lang: string) => {
  const url = new URL(`${URL_ORIGIN}/api/v2/apps/${manifestId}`);
  url.searchParams.set("llVersion", LLVersion);
  url.searchParams.set("platform", PLATFORM);
  url.searchParams.set("lang", lang ? lang : "en");

  return async () => {
    const res = await network<LiveAppManifest>({
      url: url.toString(),
    });
    return res.data;
  };
};

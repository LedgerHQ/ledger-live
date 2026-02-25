import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import {
  fetchManifests,
  selectManifests,
  getNextPageParam,
  fetchManifestsMock,
} from "LLM/features/Web3Hub/utils/api/manifests";
import { useLocale } from "~/context/Locale";

export const queryKey = (
  search: string,
  isExperimentalAppEnabled: boolean,
  isDebugAppEnabled: boolean,
  locale: string,
) => [
  "web3hub/manifests/search",
  search,
  isExperimentalAppEnabled ? "exp-on" : "exp-off",
  isDebugAppEnabled ? "debug-on" : "debug-off",
  locale,
];

const isInTest = process.env.NODE_ENV === "test" || !!process.env.MOCK_WEB3HUB;
const queryFn = isInTest ? fetchManifestsMock : fetchManifests;

export default function useSearchListViewModel(search: string) {
  const trimmedSearch = useMemo(() => {
    return search.trim();
  }, [search]);

  const isExperimentalAppEnabled = useEnv<"PLATFORM_EXPERIMENTAL_APPS">(
    "PLATFORM_EXPERIMENTAL_APPS",
  ) as boolean;
  const isDebugAppEnabled = useEnv<"PLATFORM_DEBUG">("PLATFORM_DEBUG") as boolean;
  const { locale } = useLocale();

  const manifestsQuery = useInfiniteQuery({
    queryKey: queryKey(trimmedSearch, isExperimentalAppEnabled, isDebugAppEnabled, locale),
    queryFn: queryFn("", trimmedSearch, isExperimentalAppEnabled, isDebugAppEnabled, locale),
    initialPageParam: 1,
    getNextPageParam,
    select: selectManifests,
  });

  const isLoading = manifestsQuery.isLoading || manifestsQuery.isFetching;

  return {
    data: manifestsQuery.data,
    isLoading,
    onEndReached: manifestsQuery.hasNextPage ? manifestsQuery.fetchNextPage : undefined,
  };
}

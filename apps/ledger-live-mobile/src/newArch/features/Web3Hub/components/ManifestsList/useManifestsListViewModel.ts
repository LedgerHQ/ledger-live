import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchManifests,
  selectManifests,
  getNextPageParam,
  fetchManifestsMock,
} from "LLM/features/Web3Hub/utils/api/manifests";

export const queryKey = (selectedCategory: string) => ["web3hub/manifests", selectedCategory];

const isInTest = process.env.NODE_ENV === "test" || !!process.env.MOCK_WEB3HUB;
const queryFn = isInTest ? fetchManifestsMock : fetchManifests;

export default function useManifestListViewModel(selectedCategory: string) {
  const manifestsQuery = useInfiniteQuery({
    queryKey: queryKey(selectedCategory),
    queryFn: queryFn(selectedCategory, ""),
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

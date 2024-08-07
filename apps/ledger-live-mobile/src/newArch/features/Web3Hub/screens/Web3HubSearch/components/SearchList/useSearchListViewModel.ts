import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchManifests,
  selectManifests,
  getNextPageParam,
  fetchManifestsMock,
} from "LLM/features/Web3Hub/utils/api/manifests";

export const queryKey = (search: string) => ["web3hub/manifests/search", search];

const isInTest = process.env.NODE_ENV === "test" || !!process.env.MOCK_WEB3HUB;
const queryFn = isInTest ? fetchManifestsMock : fetchManifests;

export default function useSearchListViewModel(search: string) {
  const manifestsQuery = useInfiniteQuery({
    queryKey: queryKey(search),
    queryFn: queryFn("", search),
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

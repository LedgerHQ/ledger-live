import { useCallback, useEffect, useMemo, useState } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  cryptopanicAvailableRegions,
  CryptopanicAvailableRegionsType,
  CryptopanicGetParams,
  CryptopanicNewsWithMetadata,
  getPosts,
} from "./cryptopanicApi";
import { useLocale } from "../../context/Locale";

type LoadingStateType = null | "initial" | "refreshing" | "loadingMore";

export function useCryptopanicPosts(
  params: Omit<CryptopanicGetParams, "auth_token" | "regions" | "page">,
) {
  const { locale } = useLocale();
  const newsfeedPageFeature = useFeature("newsfeedPage");
  const [loadingState, setLoadingState] = useState<LoadingStateType>(null);
  const [ready, setReady] = useState(false);
  const [lastDataLoadingDate, setLastDataLoadingDate] = useState<
    Date | undefined
  >();
  const [posts, setPosts] = useState<CryptopanicNewsWithMetadata[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const cryptopanicLocale = useMemo(
    () =>
      cryptopanicAvailableRegions.includes(
        locale as CryptopanicAvailableRegionsType,
      )
        ? locale
        : undefined,
    [locale],
  );

  const getCryptoPanicPosts = useCallback(
    async (
      { page = 1, concatPosts = false },
      loadingState: LoadingStateType,
    ) => {
      try {
        setLoadingState(loadingState);
        const apiResult = await getPosts({
          ...params,
          page,
          regions: cryptopanicLocale && [
            cryptopanicLocale as CryptopanicAvailableRegionsType,
          ],
          auth_token: newsfeedPageFeature?.params.cryptopanicApiKey,
        });
        if (concatPosts) {
          setPosts(currentPosts => currentPosts.concat(apiResult.results));
        } else {
          setPosts(apiResult.results);
        }
        // Fixme: Limit page number to 4 (20 items per page), as having too many items in the list break the performance
        setHasMore(!!apiResult.next && page < 4);
        setCurrentPage(page);
        setLastDataLoadingDate(new Date());
      } catch (e) {
        // handle error
      }
      setLoadingState(null);
      setReady(true);
    },
    // maybe spread params object to array to reduce re-render
    [cryptopanicLocale, newsfeedPageFeature?.params.cryptopanicApiKey, params],
  );

  // Init
  useEffect(() => {
    if (!ready && !loadingState) {
      getCryptoPanicPosts({ page: 1 }, "initial");
    }
  }, [getCryptoPanicPosts, loadingState, ready]);

  const refresh = useCallback(async () => {
    if (!ready || loadingState) return;
    await getCryptoPanicPosts({ page: 1 }, "refreshing");
  }, [getCryptoPanicPosts, loadingState, ready]);

  const loadMore = useCallback(async () => {
    if (!ready || loadingState || !hasMore) return;
    await getCryptoPanicPosts(
      { page: currentPage + 1, concatPosts: true },
      "loadingMore",
    );
  }, [currentPage, getCryptoPanicPosts, hasMore, loadingState, ready]);

  return {
    posts,
    hasMore,
    ready,
    loadingState,
    refresh,
    loadMore,
    lastDataLoadingDate,
  };
}

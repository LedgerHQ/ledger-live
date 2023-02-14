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

export async function useCryptopanicPosts(params: CryptopanicGetParams) {
  const { locale } = useLocale();
  const newsfeedPageFeature = useFeature("newsfeedPage");
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
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
    async ({ page = 1, concatPosts = false }) => {
      try {
        setIsLoading(true);
        const apiResult = await getPosts({
          ...params,
          page,
          regions: cryptopanicLocale && [
            cryptopanicLocale as CryptopanicAvailableRegionsType,
          ],
        });
        if (concatPosts) {
          setPosts(currentPosts => currentPosts.concat(apiResult.results));
        } else {
          setPosts(apiResult.results);
        }
        setHasMore(!!apiResult.next);
        setCurrentPage(page);
      } catch (e) {
        // handle error
      }
      setIsLoading(false);
      setReady(true);
    },
    // maybe spread params object to array to reduce re-render
    [cryptopanicLocale, params],
  );

  // Init
  useEffect(() => {
    if (ready || isLoading) return;
    getCryptoPanicPosts({ page: 1 });
  }, [getCryptoPanicPosts, isLoading, ready]);

  const refresh = useCallback(async () => {
    if (!ready || isLoading) return;
    await getCryptoPanicPosts({ page: 1 });
  }, [getCryptoPanicPosts, isLoading, ready]);

  const loadMore = useCallback(async () => {
    if (!ready || isLoading || !hasMore) return;
    await getCryptoPanicPosts({ page: currentPage + 1, concatPosts: true });
  }, [currentPage, getCryptoPanicPosts, hasMore, isLoading, ready]);

  return { posts, hasMore, ready, isLoading, refresh, loadMore };
}

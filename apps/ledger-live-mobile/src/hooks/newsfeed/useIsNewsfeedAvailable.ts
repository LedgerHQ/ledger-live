import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  cryptopanicAvailableRegions,
  CryptopanicAvailableRegionsType,
} from "./cryptopanicApi";
import { useLocale } from "../../context/Locale";

export function useIsNewsfeedAvailable() {
  const { locale } = useLocale();
  const newsfeedPageFeature = useFeature("newsfeedPage");

  return (
    newsfeedPageFeature?.enabled &&
    newsfeedPageFeature?.params?.cryptopanicApiKey &&
    cryptopanicAvailableRegions.includes(
      locale as CryptopanicAvailableRegionsType,
    ) &&
    newsfeedPageFeature?.params?.whitelistedLocales?.includes(locale)
  );
}

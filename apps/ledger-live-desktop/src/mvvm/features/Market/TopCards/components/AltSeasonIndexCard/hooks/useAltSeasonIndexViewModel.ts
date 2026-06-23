import {
  FIFTEEN_MINUTES_IN_MS,
  useGetAltcoinSeasonIndexLatestQuery,
} from "@ledgerhq/live-common/cmc-client/state-manager/api";
import { track } from "~/renderer/analytics/segment";

const getAltSeasonTranslationKey = (value: number) =>
  value < 50
    ? "market.topCards.altSeason.levels.bitcoin"
    : "market.topCards.altSeason.levels.altcoin";

export const useAltSeasonIndexViewModel = () => {
  const { data, isError, isLoading } = useGetAltcoinSeasonIndexLatestQuery(undefined, {
    pollingInterval: FIFTEEN_MINUTES_IN_MS,
  });

  const onClick = () => {
    track("button_clicked", {
      button: "alt_season_index_definition",
    });
  };

  return {
    data,
    label: data ? getAltSeasonTranslationKey(data.value) : "",
    isError,
    isLoading,
    onClick,
  };
};

import { track } from "~/renderer/analytics/segment";
import { AnalyticsButton, AnalyticsPage } from "../types/enum/Analytics";

type OnClickTrack = {
  button: (typeof AnalyticsButton)[keyof typeof AnalyticsButton];
  page: (typeof AnalyticsPage)[keyof typeof AnalyticsPage];
};

type useCollectiblesAnalyticsProps = {
  hasInscriptions: boolean;
  hasRareSat: boolean;
};

export function useCollectiblesAnalytics({
  hasInscriptions,
  hasRareSat,
}: useCollectiblesAnalyticsProps) {
  const onClickTrack = ({ button, page }: OnClickTrack) => {
    track("button_clicked2", { button, page, hasRareSat, hasInscriptions });
  };

  return { onClickTrack };
}

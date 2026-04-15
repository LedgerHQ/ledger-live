import { ScreenName } from "~/const";

export type BaanxCardNavigatorParamList = {
  [ScreenName.BaanxCardLogin]: undefined;
  [ScreenName.BaanxCardDashboard]: { transactionId?: string } | undefined;
};

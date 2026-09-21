import { ScreenName } from "~/const";
import type { CardAssetRow } from "@features/flow-pay-card-assets";

export type HistoryScope =
  | { kind: "crypto" }
  | { kind: "account"; accountIds: string[] }
  | { kind: "pay" }
  | { kind: "cardAsset"; asset: CardAssetRow };

export type OperationsHistoryNavigatorParamsList = {
  [ScreenName.OperationsList]: { scope: HistoryScope };
};

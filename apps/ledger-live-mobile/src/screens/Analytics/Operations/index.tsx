import React, { memo } from "react";

import { ScreenName } from "~/const";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useHideSpamCollection } from "~/hooks/nfts/useHideSpamCollection";
import { OperationListV1 } from "./operationsV1";
import { OperationListV2 } from "./operationsV2";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.AnalyticsOperations>;

export function Operations({ navigation, route }: Props) {
  const { enabled: spamFilteringTxEnabled } = useHideSpamCollection();

  return spamFilteringTxEnabled ? (
    <OperationListV2 navigation={navigation} route={route} />
  ) : (
    <OperationListV1 navigation={navigation} route={route} />
  );
}

export default withDiscreetMode(memo<Props>(Operations));

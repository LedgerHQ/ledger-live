import React, { memo } from "react";
import { AccountLikeArray } from "@ledgerhq/types-live";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useHideSpamCollection } from "~/hooks/nfts/useHideSpamCollection";
import OperationsHistoryV1 from "./OperationsHistoryV1";
import OperationsHistoryV2 from "./OperationsHistoryV2";

type Props = {
  accounts: AccountLikeArray;
  testID?: string;
};

const NB_OPERATIONS_TO_DISPLAY = 3;

const OperationsHistory = ({ accounts, testID }: Props) => {
  const { enabled: spamFilteringTxEnabled } = useHideSpamCollection();

  return spamFilteringTxEnabled ? (
    <OperationsHistoryV2
      accounts={accounts}
      opCount={NB_OPERATIONS_TO_DISPLAY}
      skipOp={0}
      testID={testID}
    />
  ) : (
    <OperationsHistoryV1 accounts={accounts} opCount={NB_OPERATIONS_TO_DISPLAY} />
  );
};

export default withDiscreetMode(memo<Props>(OperationsHistory));

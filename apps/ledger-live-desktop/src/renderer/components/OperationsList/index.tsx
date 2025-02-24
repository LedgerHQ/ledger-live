import React from "react";
import { compose } from "redux";
import { useTranslation, withTranslation } from "react-i18next";
import { Props } from "./OperationsListV2/useOperationsList";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import OperationsListV1 from "./OperationsListV1";
import OperationsListV2 from "./OperationsListV2";

export function OperationsList(props: Props) {
  const spamFilteringTxFeature = useFeature("lldSpamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const { t } = useTranslation();

  //both features must be enabled to enable spam filtering
  const spamFilteringTxEnabled =
    (nftsFromSimplehashFeature?.enabled && spamFilteringTxFeature?.enabled) || false;

  const { account, accounts } = props;
  if (!account && !accounts) {
    return null;
  }
  if (spamFilteringTxEnabled) {
    return <OperationsListV2 {...props} />;
  } else {
    return <OperationsListV1 {...props} t={t} />;
  }
}

export default compose<React.ComponentType<Props>>(withTranslation())(OperationsList);

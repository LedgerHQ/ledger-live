import { useTranslation } from "react-i18next";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React, { useEffect, useState } from "react";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";

export const IncompleteHistoryBanner: React.FC<{ account: CosmosAccount }> = ({ account }) => {
  const { t } = useTranslation();
  const { cosmosResources } = account;
  const [dispalyModal, setDisplayModal] = useState(false);

  useEffect(() => {
    const { lowestBlockHeight } = cosmosResources;
    if (lowestBlockHeight.isGreaterThan(1)) {
      setDisplayModal(true);
    }
  }, [cosmosResources]);
  const title = t("banners.incompleteHistory.title");
  const description = t("banners.incompleteHistory.description", {
    block: cosmosResources.lowestBlockHeight,
  });

  return <AccountBanner title={title} description={description} display={dispalyModal} />;
};

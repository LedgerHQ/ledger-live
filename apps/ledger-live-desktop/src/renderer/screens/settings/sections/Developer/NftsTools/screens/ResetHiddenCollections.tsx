import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetHiddenNftCollections } from "~/renderer/actions/settings";
import Button from "~/renderer/components/Button";
import { t } from "i18next";
import { SettingsSectionRow } from "../../../../SettingsSection";
import { nftCollectionsStatusByNetworkSelector } from "~/renderer/reducers/settings";

import { NftStatus } from "@ledgerhq/live-nft/types";
import Box from "~/renderer/components/Box";

const ResetHiddenCollections = () => {
  const dispatch = useDispatch();
  const reset = useCallback(() => dispatch(resetHiddenNftCollections()), [dispatch]);

  const collections = useSelector(nftCollectionsStatusByNetworkSelector);

  const hiddenNftCollections = useMemo(
    () =>
      Object.values(collections).flatMap(network =>
        Object.keys(network).filter(
          collection =>
            network[collection] === NftStatus.blacklisted || network[collection] === NftStatus.spam,
        ),
      ),
    [collections],
  );

  return (
    <SettingsSectionRow
      title={t("settings.developer.nfts.title")}
      desc={t("settings.developer.nfts.description")}
    >
      {hiddenNftCollections.length === 0 ? (
        <Box ff="Inter" fontSize={3} mr={2}>
          {t("settings.accounts.hiddenNftCollections.count", {
            count: hiddenNftCollections.length,
          })}
        </Box>
      ) : (
        <Button onClick={reset} danger>
          {t("settings.developer.nfts.reset", {
            count: hiddenNftCollections.length,
          })}
        </Button>
      )}
    </SettingsSectionRow>
  );
};
export default ResetHiddenCollections;

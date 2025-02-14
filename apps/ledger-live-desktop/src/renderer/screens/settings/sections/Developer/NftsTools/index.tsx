import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetHiddenNftCollections } from "~/renderer/actions/settings";
import Button from "~/renderer/components/Button";
import { t } from "i18next";
import { SettingsSectionRow } from "../../../SettingsSection";
import { nftCollectionsStatusByNetworkSelector } from "~/renderer/reducers/settings";

const ResetHiddenCollections = () => {
  const dispatch = useDispatch();
  const nfts = useSelector(nftCollectionsStatusByNetworkSelector);
  const reset = useCallback(() => dispatch(resetHiddenNftCollections()), [dispatch]);

  if (Object.keys(nfts).length === 0) return null;
  return (
    <SettingsSectionRow
      title={t("settings.developer.nfts.title")}
      desc={t("settings.developer.nfts.description")}
    >
      <Button onClick={reset} danger>
        {t("settings.developer.nfts.reset")}
      </Button>
    </SettingsSectionRow>
  );
};
export default ResetHiddenCollections;

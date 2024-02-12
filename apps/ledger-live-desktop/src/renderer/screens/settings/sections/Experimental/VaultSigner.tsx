import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useDispatch, useSelector } from "react-redux";
import { vaultSignerSelector } from "~/renderer/reducers/settings";
import { setVaultSigner } from "~/renderer/actions/settings";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { openModal } from "~/renderer/actions/modals";
import Switch from "~/renderer/components/Switch";

const VaultSigner = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_VAULT_SIGNER", undefined)),
    [dispatch],
  );
  const { enabled, ...rest } = useSelector(vaultSignerSelector);

  const handleChange = (val: boolean) => {
    dispatch(setVaultSigner({ ...rest, enabled: val }));
    if (val) {
      onOpenModal();
    }
  };

  return (
    <SettingsSectionRow
      title={t("settings.experimental.features.vaultSigner.title")}
      desc={t("settings.experimental.features.vaultSigner.description")}
    >
      <Switch isChecked={enabled} onChange={handleChange} data-test-id={`enable-vault-signer`} />
    </SettingsSectionRow>
  );
};

export default VaultSigner;

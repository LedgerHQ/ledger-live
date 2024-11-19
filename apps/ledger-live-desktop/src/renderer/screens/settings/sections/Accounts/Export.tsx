import React, { SyntheticEvent, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import ExportOperationsBtn from "~/renderer/components/ExportOperationsBtn";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
const SectionExport = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const ledgerSyncFF = useFeature("lldWalletSync");

  const onModalOpen = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      dispatch(openModal("MODAL_EXPORT_ACCOUNTS", undefined));
    },
    [dispatch],
  );
  return (
    <>
      {!ledgerSyncFF?.enabled && (
        <Row title={t("settings.export.accounts.title")} desc={t("settings.export.accounts.desc")}>
          <Button small event="Export accounts" onClick={onModalOpen} primary>
            {t("settings.export.accounts.button")}
          </Button>
        </Row>
      )}
      <Row
        title={t("settings.export.operations.title")}
        desc={t("settings.export.operations.desc")}
        dataTestId="save-operation-history-row"
      >
        <ExportOperationsBtn
          primary
          t={t}
          openModal={() => ""}
          accounts={[]}
          dataTestId="save-operation-history-btn"
        />
      </Row>
    </>
  );
};
export default SectionExport;

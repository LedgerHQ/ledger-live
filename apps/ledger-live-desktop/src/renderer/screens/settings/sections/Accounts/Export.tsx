import React from "react";
import { useTranslation } from "react-i18next";
import ExportOperationsBtn from "~/renderer/components/ExportOperationsBtn";
import { SettingsSectionRow as Row } from "../../SettingsSection";
const SectionExport = () => {
  const { t } = useTranslation();

  return (
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
  );
};
export default SectionExport;

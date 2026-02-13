import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "~/renderer/screens/settings/SettingsSection";
import { useDoNotAskAgainSkipMemo } from "~/renderer/actions/settings";
import Switch from "~/renderer/components/Switch";

export default function DoNotAskAgainSkipMemo() {
  const [doNotAskAgainSkipMemo, setDoNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();
  const { t } = useTranslation();

  return (
    <Row
      title={t("settings.accounts.doNotAskAgainSkipMemo.title")}
      desc={t("settings.accounts.doNotAskAgainSkipMemo.desc")}
    >
      <Switch isChecked={doNotAskAgainSkipMemo} onChange={setDoNotAskAgainSkipMemo} />
    </Row>
  );
}

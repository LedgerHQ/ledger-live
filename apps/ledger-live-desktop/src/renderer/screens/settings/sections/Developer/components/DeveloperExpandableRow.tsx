import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "../../../SettingsSection";

type Props = {
  title: React.ReactNode;
  desc: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  childrenAlignSelf?: "center" | "flex-start";
};

const DeveloperExpandableRow = ({ title, desc, expanded, onToggle, childrenAlignSelf }: Props) => {
  const { t } = useTranslation();

  return (
    <SettingsSectionRow
      title={title}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{
        alignSelf: childrenAlignSelf ?? (expanded ? "flex-start" : "center"),
      }}
      desc={desc}
    >
      <Button size="sm" appearance="accent" onClick={onToggle}>
        {expanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </SettingsSectionRow>
  );
};

export default DeveloperExpandableRow;

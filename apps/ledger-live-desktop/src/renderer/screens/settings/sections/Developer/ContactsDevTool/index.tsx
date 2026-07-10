import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { ContactsDevToolContent } from "./ContactsDevToolContent";

const ContactsDevTool = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(prev => !prev);
  }, []);

  return (
    <Row
      title={t("settings.developer.contactsDevTool.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<ContactsDevToolContent expanded={contentExpanded} />}
    >
      <Button appearance="accent" size="sm" onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default ContactsDevTool;

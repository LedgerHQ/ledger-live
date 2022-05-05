import React, { memo, useState, useCallback } from "react";
import { Trans } from "react-i18next";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import SettingsRow from "../../../components/SettingsRow";
import { TermModals } from "../../../components/RequireTerms";

const TermsConditionsRow = () => {
  const [isOpened, open] = useState(false);

  const onOpen = useCallback(() => open(true), [open]);
  const onClose = useCallback(() => open(false), [open]);

  return (
    <>
      <SettingsRow
        event="TermsConditionsRow"
        title={<Trans i18nKey="settings.about.termsConditions" />}
        desc={<Trans i18nKey="settings.about.termsConditionsDesc" />}
        onPress={onOpen}
      >
        <ExternalLinkMedium size={20} color={"neutral.c100"} />
      </SettingsRow>
      <TermModals isOpened={isOpened} close={onClose} />
    </>
  );
};

export default memo(TermsConditionsRow);

import React from "react";
import { Trans } from "~/context/Locale";
import Alert from "~/components/Alert";

function MultiversXAccountSubHeader() {
  return (
    <Alert type="warning">
      <Trans i18nKey="elrond.guardedAccountWarning" />
    </Alert>
  );
}

export default MultiversXAccountSubHeader;

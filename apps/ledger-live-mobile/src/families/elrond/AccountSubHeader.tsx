import React, { Fragment } from "react";
import { Trans } from "react-i18next";

import AccountSubHeader from "~/components/AccountSubHeader";
import Alert from "~/components/Alert";

/*
 * Handle the component declaration.
 */

const ElrondAccountSubHeader = () => (
  <Fragment>
    <AccountSubHeader family="MultiversX" team="MultiversX" />

    <Alert type="warning">
      <Trans i18nKey={`elrond.guardedAccountWarning`} />
    </Alert>
  </Fragment>
);

export default ElrondAccountSubHeader;

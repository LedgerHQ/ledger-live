import React, { useState } from "react";
import { Trans } from "react-i18next";

import { Alert } from "@ledgerhq/react-ui";

import { colors } from "~/renderer/styles/theme";

import Label from "~/renderer/components/Label";

import MemoTagInfoBody from "./MemoTagInfoBody";

const MemoTagInfo = () => {
  const [isAlertDisplayed, toggleAlertDisplay] = useState(false);

  const handleOnToggleAlertDisplay = () => {
    toggleAlertDisplay(!isAlertDisplayed);
  };

  return !isAlertDisplayed ? (
    <Label
      color={colors.wallet}
      style={{
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
      }}
      onClick={handleOnToggleAlertDisplay}
    >
      <Trans i18nKey="receive.memoTag.title" />
    </Label>
  ) : (
    <Alert
      containerProps={{
        p: 12,
        borderRadius: "4px",
      }}
      renderContent={() => <MemoTagInfoBody />}
    />
  );
};

export default MemoTagInfo;

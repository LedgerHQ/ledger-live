// @flow
import React from "react";
import { Trans, withTranslation } from "react-i18next";
import TransferIdField from "./TransferIdField";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";

const Root = (props: *) => {
  return (
    <Box flow={1}>
      <Box>
        <Label>
          <LabelInfoTooltip text={<Trans i18nKey="families.casper.transferIdWarningText" />}>
            <span>
              <Trans i18nKey="families.casper.transferId" />
            </span>
          </LabelInfoTooltip>
        </Label>
      </Box>
      <Box horizontal grow alignItems="center" justifyContent="space-between">
        <Box>
          <TransferIdField {...props} />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: withTranslation()(Root),
  // Transaction is used here to prevent user to forward
  fields: ["transferId", "transaction"],
};

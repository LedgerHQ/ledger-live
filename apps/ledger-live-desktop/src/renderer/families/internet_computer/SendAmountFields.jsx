// @flow
import React from "react";
import { Trans, withTranslation } from "react-i18next";
import MemoField from "./MemoField";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
// import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";

const Root = (props: *) => {
  return (
    <Box flow={1}>
      <Box>
        <Label>
          {" "}
          <span>
            <Trans i18nKey="families.internet_computer.memo" />
          </span>
        </Label>
      </Box>
      <Box horizontal grow alignItems="center" justifyContent="space-between">
        <Box>
          <MemoField {...props} />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: withTranslation()(Root),
  // Transaction is used here to prevent user to forward
  fields: ["memo", "transaction"],
};

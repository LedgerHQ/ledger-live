import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import MemoValueField from "./MemoValueField";
import { CryptoOrgFamily } from "./types";

const Root: NonNullable<CryptoOrgFamily["sendRecipientFields"]>["component"] = props => {
  const { t } = useTranslation();
  return (
    <Box flow={1}>
      <Box mb={10}>
        <Label>
          <LabelInfoTooltip text={t("cryptoOrg.memoWarningText")}>
            <span>{t("cryptoOrg.memo")}</span>
          </LabelInfoTooltip>
        </Label>
      </Box>
      <Box mb={15} horizontal grow alignItems="center" justifyContent="space-between">
        <Box grow={1}>
          <MemoValueField {...props} />
        </Box>
      </Box>
    </Box>
  );
};
export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  // If he format a memo incorrectly
  fields: ["memo", "transaction"],
};

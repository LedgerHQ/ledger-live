import React from "react";
import { useTranslation } from "react-i18next";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import LabelWithExternalIcon from "~/renderer/components/LabelWithExternalIcon";
import { urls } from "~/config/urls";
import { track } from "~/renderer/analytics/segment";

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  i18nKeyOverride?: string;
};

const FeesContainer = ({ children, header, i18nKeyOverride }: Props) => {
  const { t } = useTranslation();

  return (
    <Box flow={1}>
      <Box horizontal alignItems="center" justifyContent="space-between">
        <LabelWithExternalIcon
          onClick={() => {
            openURL(urls.feesMoreInfo);
            track("Send Flow Fees Help Requested");
          }}
          label={t(i18nKeyOverride || "send.steps.details.fees")}
        />
        {header}
      </Box>
      {children}
    </Box>
  );
};

export default FeesContainer;

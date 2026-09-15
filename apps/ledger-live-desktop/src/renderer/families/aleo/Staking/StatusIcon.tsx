import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box/Box";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ToolTip from "~/renderer/components/Tooltip";
import type { AleoNonEarningReason } from "./useStakingPosition";

const StatusIcon = ({
  nonEarningReason,
}: {
  nonEarningReason: AleoNonEarningReason | undefined;
}) => {
  const { t } = useTranslation();

  if (!nonEarningReason) {
    return (
      <Box color="positiveGreen" pl={2}>
        <ToolTip content={t("aleo.stake.status.earningTooltip")}>
          <CheckCircle size={14} />
        </ToolTip>
      </Box>
    );
  }

  return (
    <Box color="warning.c70" pl={2}>
      <ToolTip content={t(`aleo.stake.nonEarning.${nonEarningReason}`)}>
        <Icons.Warning size="XS" />
      </ToolTip>
    </Box>
  );
};

export default StatusIcon;

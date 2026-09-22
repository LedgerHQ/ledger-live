import React from "react";
import { useTranslation } from "react-i18next";
import type { AleoNonEarningReason } from "@ledgerhq/live-common/families/aleo/react";
import Box from "~/renderer/components/Box/Box";
import { PlaceholderLine } from "~/renderer/components/Placeholder";
import ToolTip from "~/renderer/components/Tooltip";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ExclamationCircleThin from "~/renderer/icons/ExclamationCircleThin";
import InfoCircle from "~/renderer/icons/InfoCircle";

type Props = {
  nonEarningReason: AleoNonEarningReason | undefined;
  /** The validator list is still being fetched. */
  loading: boolean;
  /** The validator list could not be read, so the status cannot be worked out at all. */
  unverified: boolean;
};

/**
 * `nonEarningReason` is `undefined` both for a healthy position and for one whose validator list
 * never arrived, so the list's own state has to be read alongside it: claiming "earning rewards"
 * off an unread committee is an assertion about the user's money that nothing backs.
 */
const StatusIcon = ({ nonEarningReason, loading, unverified }: Props) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box pl={2}>
        <PlaceholderLine width={14} height={14} data-testid="aleo-status-loading" />
      </Box>
    );
  }

  if (unverified) {
    return (
      <Box color="neutral.c70" pl={2} role="img" aria-label={t("aleo.stake.status.unknown")}>
        <ToolTip content={t("aleo.stake.status.unknown")}>
          <InfoCircle size={14} />
        </ToolTip>
      </Box>
    );
  }

  if (!nonEarningReason) {
    return (
      <Box color="success.c70" pl={2} role="img" aria-label={t("aleo.stake.status.earningTooltip")}>
        <ToolTip content={t("aleo.stake.status.earningTooltip")}>
          <CheckCircle size={14} />
        </ToolTip>
      </Box>
    );
  }

  return (
    <Box
      color="warning.c70"
      pl={2}
      role="img"
      aria-label={t(`aleo.stake.nonEarning.${nonEarningReason}`)}
    >
      <ToolTip content={t(`aleo.stake.nonEarning.${nonEarningReason}`)}>
        <ExclamationCircleThin size={14} />
      </ToolTip>
    </Box>
  );
};

export default StatusIcon;

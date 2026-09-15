import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import Box from "~/renderer/components/Box/Box";
import Discreet from "~/renderer/components/Discreet";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openURL } from "~/renderer/linking";
import { Column, Ellipsis, SubLabel, Wrapper } from "../blocks/Staking";
import StatusIcon from "./StatusIcon";
import type { AleoStakingPosition } from "./useStakingPosition";

type Props = {
  account: AleoAccount;
  position: AleoStakingPosition;
};

const StakedRow = ({ account, position }: Props) => {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const { bondedBalance, bondedValidator, validatorLabel, nonEarningReason, estimatedRate } =
    position;

  const onExternalLink = useCallback(() => {
    if (!bondedValidator) return;
    const explorerView = getDefaultExplorerView(account.currency);
    const url = explorerView && getAddressExplorer(explorerView, bondedValidator);
    if (url) openURL(url);
  }, [account.currency, bondedValidator]);

  return (
    <Wrapper>
      <Column strong clickable={!!bondedValidator} onClick={onExternalLink}>
        <Box mr={2}>
          <FirstLetterIcon label={validatorLabel || "?"} />
        </Box>
        <Box style={{ minWidth: 0 }}>
          <Ellipsis>{validatorLabel || t("aleo.stake.table.unknownValidator")}</Ellipsis>
          {bondedValidator ? (
            <ToolTip content={bondedValidator}>
              <SubLabel>{shortAddressPreview(bondedValidator)}</SubLabel>
            </ToolTip>
          ) : null}
        </Box>
      </Column>

      <Column>
        <StatusIcon nonEarningReason={nonEarningReason} />
      </Column>

      <Column>
        <Discreet>
          {formatCurrencyUnit(unit, bondedBalance, {
            showCode: true,
            disableRounding: true,
          })}
        </Discreet>
      </Column>

      <Column>
        {estimatedRate === undefined
          ? "-"
          : t("aleo.stake.table.estimatedRate", {
              rate: (estimatedRate * 100).toFixed(1),
            })}
      </Column>
    </Wrapper>
  );
};

export default StakedRow;

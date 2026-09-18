import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import Box from "~/renderer/components/Box/Box";
import Discreet from "~/renderer/components/Discreet";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import { PlaceholderLine } from "~/renderer/components/Placeholder";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openURL } from "~/renderer/linking";
import { Column, Ellipsis, SubLabel, Wrapper } from "./styles";
import StatusIcon from "./StatusIcon";

type Props = {
  account: AleoAccount;
  position: AleoStakingPositionView;
};

const StakedRow = ({ account, position }: Props) => {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const {
    bondedBalance,
    bondedValidator,
    validatorLabel,
    nonEarningReason,
    estimatedRate,
    validatorsLoading,
    validatorsError,
  } = position;

  // The name, the status and the rate all come off the validator list, so none of them has an
  // answer until it has been read — and each would otherwise show a wrong one: a generic name, a
  // green tick, a dash that reads as "this validator pays nothing we can quote".
  const committeeUnread = validatorsLoading || validatorsError !== null;

  // The list names the validator; the address is all the account itself carries. Falling back to
  // the address here would put it in the name slot as well as in the sublabel below.
  const name = validatorLabel ?? t("aleo.stake.table.unknownValidator");

  const onExternalLink = useCallback(() => {
    if (!bondedValidator) return;
    const explorerView = getDefaultExplorerView(account.currency);
    const url = explorerView && getAddressExplorer(explorerView, bondedValidator);
    if (url) openURL(url);
  }, [account.currency, bondedValidator]);

  const renderRate = () => {
    if (committeeUnread) return <PlaceholderLine width={48} data-testid="aleo-rate-unknown" />;
    if (estimatedRate === undefined) return "-";
    return t("aleo.stake.table.estimatedRate", { rate: (estimatedRate * 100).toFixed(1) });
  };

  return (
    <Wrapper>
      <Column strong clickable={!!bondedValidator} onClick={onExternalLink}>
        <Box mr={2}>
          <FirstLetterIcon label={committeeUnread ? "" : name} />
        </Box>
        <Box style={{ minWidth: 0 }}>
          {committeeUnread ? (
            <PlaceholderLine width={90} data-testid="aleo-validator-unknown" />
          ) : (
            <Ellipsis>{name}</Ellipsis>
          )}
          {bondedValidator ? (
            <ToolTip content={bondedValidator}>
              <SubLabel>{shortAddressPreview(bondedValidator)}</SubLabel>
            </ToolTip>
          ) : null}
        </Box>
      </Column>

      <Column>
        <StatusIcon
          nonEarningReason={nonEarningReason}
          loading={validatorsLoading}
          unverified={validatorsError !== null}
        />
      </Column>

      <Column>
        <Discreet>
          {formatCurrencyUnit(unit, bondedBalance, {
            showCode: true,
            disableRounding: true,
          })}
        </Discreet>
      </Column>

      <Column>{renderRate()}</Column>
    </Wrapper>
  );
};

export default StakedRow;

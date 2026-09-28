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

  // address only stands in for the name once the list fetch has failed for good
  const shortAddress = bondedValidator ? shortAddressPreview(bondedValidator) : null;
  const addressAsName = validatorsError !== null && !validatorLabel ? shortAddress : null;
  const name = validatorLabel || addressAsName || t("aleo.stake.table.unknownValidator");

  const onExternalLink = useCallback(() => {
    if (!bondedValidator) return;
    const explorerView = getDefaultExplorerView(account.currency);
    const url = explorerView && getAddressExplorer(explorerView, bondedValidator);
    if (url) openURL(url);
  }, [account.currency, bondedValidator]);

  const renderRate = () => {
    if (validatorsLoading) return <PlaceholderLine width={48} data-testid="aleo-rate-unknown" />;
    if (estimatedRate === undefined) return "-";
    return t("aleo.stake.table.estimatedRate", { rate: (estimatedRate * 100).toFixed(1) });
  };

  const renderName = () => {
    if (validatorsLoading) {
      return <PlaceholderLine width={90} data-testid="aleo-validator-unknown" />;
    }

    if (!addressAsName) {
      return <Ellipsis>{name}</Ellipsis>;
    }

    return (
      <ToolTip content={bondedValidator}>
        <Ellipsis>{addressAsName}</Ellipsis>
      </ToolTip>
    );
  };

  return (
    <Wrapper>
      <Column strong clickable={!!bondedValidator} onClick={onExternalLink}>
        <Box mr={2}>
          <FirstLetterIcon label={validatorsLoading ? "" : name} />
        </Box>
        <Box style={{ minWidth: 0 }}>
          {renderName()}
          {bondedValidator && !addressAsName ? (
            <ToolTip content={bondedValidator}>
              <SubLabel>{shortAddress}</SubLabel>
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

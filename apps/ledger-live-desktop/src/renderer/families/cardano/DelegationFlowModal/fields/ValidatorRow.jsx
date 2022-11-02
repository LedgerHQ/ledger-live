// @flow
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/cosmos/utils";
import type { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import type { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "react-redux";

import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import Box from "~/renderer/components/Box";
import type { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";
import ValidatorRow from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import LedgerPoolIcon from "../LedgerPoolIcon";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import { localeSelector } from "~/renderer/reducers/settings";

type Props = {
  currency: CryptoCurrency,
  pool: StakePool,
  active?: boolean,
  onClick?: (v: string) => void,
  unit: Unit,
  disabled: boolean,
};

function CardanoPoolRow({ pool, active, onClick, unit, currency, disabled }: Props) {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);

  const explorerView = getDefaultExplorerView(currency);
  const onExternalLink = useCallback(
    (address: string) => {
      if (address === LEDGER_VALIDATOR_ADDRESS) {
        openURL(urls.ledgerValidator);
      } else {
        const srURL = explorerView && getAddressExplorer(explorerView, address);

        if (srURL) openURL(srURL);
      }
    },
    [explorerView],
  );

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  const poolCost = formatCurrencyUnit(unit, new BigNumber(pool.cost), formatConfig);

  return (
    <StyledValidatorRow
      onClick={disabled ? () => {} : onClick}
      disabled={disabled}
      key={pool.poolId}
      validator={pool}
      icon={<LedgerPoolIcon validator={pool} />}
      title={`${pool.ticker} - ${pool.name}` || pool.poolId}
      onExternalLink={onExternalLink}
      unit={unit}
      sideInfo={
        <Box style={{ flexDirection: "row" }}>
          <Box style={{ flexDirection: "column" }}>
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
              {formatCurrencyUnit(unit, new BigNumber(pool.tokens), {
                showCode: true,
              })}
            </Text>
          </Box>
          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} disabled={disabled} />
          </Box>
        </Box>
      }
      subtitle={
        <Box style={{ flexDirection: "row" }}>
          <Text ff="Inter|Medium" fontSize={2} color="palette.text.shade50">
            <Trans i18nKey="cosmos.delegation.commission" /> {`${pool.margin} %`}
          </Text>
          <Text ff="Inter|Medium" ml={2} fontSize={2} color="palette.text.shade50">
            <Trans i18nKey="cardano.delegation.cost" mr={2} /> {poolCost}
          </Text>
        </Box>
      }
    ></StyledValidatorRow>
  );
}

const StyledValidatorRow: ThemedComponent<ValidatorRowProps> = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
`;

const ChosenMark: ThemedComponent<{ active: boolean }> = styled(Check).attrs(p => ({
  color: p.active
    ? p.disabled
      ? p.theme.colors.palette.action.disabled
      : p.theme.colors.palette.primary.main
    : "transparent",
  size: 14,
}))``;

export default CardanoPoolRow;

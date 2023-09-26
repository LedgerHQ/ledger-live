import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getStakePoolExplorer } from "@ledgerhq/live-common/explorers";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import LedgerPoolIcon from "../LedgerPoolIcon";
import { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";

type Props = {
  currency: CryptoCurrency;
  pool: StakePool;
  active?: boolean;
  onClick: (v: StakePool) => void;
  unit: Unit;
};

function CardanoPoolRow({ pool, active, onClick, unit, currency }: Props) {
  const explorerView = getDefaultExplorerView(currency);
  const onExternalLink = useCallback(
    (poolId: string) => {
      const srURL = explorerView && getStakePoolExplorer(explorerView, poolId);
      if (srURL) openURL(srURL);
    },
    [explorerView],
  );

  return (
    <StyledValidatorRow
      onClick={() => onClick(pool)}
      key={pool.poolId}
      validator={{
        ...pool,
        address: pool.poolId,
      }}
      icon={<LedgerPoolIcon validator={pool} />}
      title={`${pool.ticker} - ${pool.name}` || pool.poolId}
      onExternalLink={onExternalLink}
      unit={unit}
      sideInfo={
        <Box
          style={{
            flexDirection: "row",
          }}
        >
          <Box
            style={{
              flexDirection: "column",
            }}
          >
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
              {formatCurrencyUnit(unit, new BigNumber(pool.liveStake), {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans color="palette.text.shade50" i18nKey="cardano.delegation.totalStake" />
            </Text>
          </Box>
          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} />
          </Box>
        </Box>
      }
      subtitle={
        <Box
          style={{
            flexDirection: "row",
          }}
        >
          <Text ff="Inter|Medium" fontSize={2} color="palette.text.shade50">
            <Trans i18nKey="cardano.delegation.commission" /> {`${pool.margin} %`}
          </Text>
        </Box>
      }
    ></StyledValidatorRow>
  );
}

const StyledValidatorRow = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
`;

const ChosenMark = styled(Check).attrs<{
  active: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))<{
  active?: boolean;
  size?: number;
}>``;

export default CardanoPoolRow;

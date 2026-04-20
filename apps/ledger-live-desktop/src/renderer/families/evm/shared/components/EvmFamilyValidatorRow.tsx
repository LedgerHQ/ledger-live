import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { getValidatorExplorerUrl } from "@ledgerhq/live-common/families/evm/staking/logic";
import type { StakingValidatorItem } from "@ledgerhq/live-common/families/evm/staking/types";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow, { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import EvmValidatorIcon from "~/renderer/families/evm/shared/components/EvmValidatorIcon";

type Props = Readonly<{
  currency: CryptoCurrency;
  validator: StakingValidatorItem;
  active?: boolean;
  onClick?: (v: { address: string }) => void;
  unit: Unit;
}>;

function EvmFamilyValidatorRow({ validator, active, onClick, unit, currency }: Props) {
  const explorerView = getDefaultExplorerView(currency);

  const onExternalLink = useCallback(
    (address: string) => {
      const customUrl = getValidatorExplorerUrl(currency.id, address);
      const fallback = explorerView && getAddressExplorer(explorerView, address);
      const url = customUrl ?? fallback;
      if (url) openURL(url);
    },
    [currency.id, explorerView],
  );

  return (
    <StyledValidatorRow
      onClick={onClick}
      key={validator.validatorAddress}
      validator={{
        address: validator.validatorAddress,
      }}
      icon={<EvmValidatorIcon validator={validator} />}
      title={validator.name || validator.validatorAddress}
      onExternalLink={onExternalLink}
      unit={unit}
      sideInfo={
        <Box style={{ flexDirection: "row" }}>
          <Box style={{ flexDirection: "column" }}>
            <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
              {formatCurrencyUnit(unit, new BigNumber(validator.tokens), {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans color="neutral.c70" i18nKey="ethereum.evmStaking.delegation.totalStake" />
            </Text>
          </Box>
          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} />
          </Box>
        </Box>
      }
      subtitle={
        <Box>
          <Text ff="Inter|Medium" fontSize={2} color="neutral.c70">
            <Trans i18nKey="ethereum.evmStaking.delegation.commission" />{" "}
            {`${Math.round(validator.commission * 10000) / 100} %`}
          </Text>
        </Box>
      }
    />
  );
}

const StyledValidatorRow = styled(ValidatorRow)<ValidatorRowProps>`
  border-color: transparent;
  margin-bottom: 0;
`;

const ChosenMark = styled(Check).attrs<{ active?: boolean }>(p => ({
  color: p.active ? p.theme.colors.primary.c80 : "transparent",
  size: 14,
}))<{
  active?: boolean;
  size?: number;
}>``;

export default EvmFamilyValidatorRow;

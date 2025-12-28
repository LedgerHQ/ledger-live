import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { SuiValidator } from "@ledgerhq/live-common/families/sui/types";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import LedgerValidatorIcon from "~/renderer/families/sui/shared/components/LedgerValidatorIcon";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";

type Props = {
  readonly validator: SuiValidator;
  readonly active?: boolean;
  readonly onClick: (a: { address: string }) => void;
  readonly unit: Unit;
};
function SuiValidatorRow({ validator, active, onClick, unit }: Props) {
  const onExternalLink = useCallback(() => {
    if (validator.projectUrl) openURL(validator.projectUrl);
  }, [validator]);
  return (
    <StyledValidatorRow
      onClick={onClick}
      key={validator.suiAddress}
      validator={{
        address: validator.suiAddress,
      }}
      icon={<LedgerValidatorIcon validator={validator} />}
      title={validator.name || validator.suiAddress}
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
            <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
              {formatCurrencyUnit(unit, new BigNumber(validator.stakingPoolSuiBalance), {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans color="neutral.c70" i18nKey="sui.stake.totalStake" />
            </Text>
          </Box>
          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} size={14} />
          </Box>
        </Box>
      }
      subtitle={
        <Box>
          <Text ff="Inter|Medium" fontSize={2} color="neutral.c70">
            <Trans i18nKey="sui.stake.commission" /> {`${Number(validator.commissionRate) / 100}%`}
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
  active?: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.primary.c80 : "transparent",
  size: 14,
}))<{
  active?: boolean;
}>``;
export default SuiValidatorRow;

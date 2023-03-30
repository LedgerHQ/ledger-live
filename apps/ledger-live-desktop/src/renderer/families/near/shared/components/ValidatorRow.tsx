import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/near/logic";
import { NearValidatorItem } from "@ledgerhq/live-common/families/near/types";
import { CryptoCurrency, Unit } from "@ledgerhq/live-common/types/index";
import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import Box from "~/renderer/components/Box";
import ValidatorRow, { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import LedgerValidatorIcon from "~/renderer/families/near/shared/components/LedgerValidatorIcon";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
type Props = {
  currency: CryptoCurrency;
  validator: NearValidatorItem;
  active?: boolean;
  onClick?: (v: NearValidatorItem) => void;
  unit: Unit;
};
function NearValidatorRow({ validator, active, onClick, unit, currency }: Props) {
  const explorerView = getDefaultExplorerView(currency);
  const onExternalLink = useCallback(
    (address: string) => {
      if (address === FIGMENT_NEAR_VALIDATOR_ADDRESS) {
        openURL(urls.ledgerValidator);
      } else {
        const srURL = explorerView && getAddressExplorer(explorerView, address);
        if (srURL) openURL(srURL);
      }
    },
    [explorerView],
  );
  return (
    <StyledValidatorRow
      onClick={onClick}
      key={validator.validatorAddress}
      validator={{
        address: validator.validatorAddress,
      }}
      icon={<LedgerValidatorIcon validator={validator} />}
      title={validator.validatorAddress}
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
              {formatCurrencyUnit(unit, new BigNumber(validator.tokens), {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans color="palette.text.shade50" i18nKey="near.stake.totalStake" />
            </Text>
          </Box>
          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} />
          </Box>
        </Box>
      }
      subtitle={
        <Box>
          <Text ff="Inter|Medium" fontSize={2} color="palette.text.shade50">
            <Trans i18nKey="near.stake.commission" /> {`${validator.commission}%`}
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
const ChosenMark: ThemedComponent<{
  active: boolean;
}> = styled(Check).attrs(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))``;
export default NearValidatorRow;

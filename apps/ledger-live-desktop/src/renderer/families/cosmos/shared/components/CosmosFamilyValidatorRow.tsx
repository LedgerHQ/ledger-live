import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
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
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

type Props = {
  currency: CryptoCurrency;
  validator: CosmosValidatorItem;
  active?: boolean;
  onClick?: (v: { address: string }) => void;
  unit: Unit;
};
function CosmosFamilyValidatorRow({ validator, active, onClick, unit, currency }: Props) {
  const explorerView = getDefaultExplorerView(currency);
  const currencyID = currency.id;

  const ledgerValidatorUrl = useLocalizedUrl(urls.ledgerValidator);
  const onExternalLink = useCallback(
    (address: string) => {
      const ledgerValidator = cryptoFactory(currencyID).ledgerValidator;
      if (address === ledgerValidator) {
        openURL(ledgerValidatorUrl);
      } else {
        const srURL = explorerView && getAddressExplorer(explorerView, address);
        if (srURL) openURL(srURL);
      }
    },
    [currencyID, explorerView, ledgerValidatorUrl],
  );
  return (
    <StyledValidatorRow
      onClick={onClick}
      key={validator.validatorAddress}
      validator={{
        address: validator.validatorAddress,
      }}
      icon={<CosmosFamilyLedgerValidatorIcon validator={validator} />}
      title={validator.name || validator.validatorAddress}
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
              <Trans color="palette.text.shade50" i18nKey={`cosmos.delegation.totalStake`} />
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
            <Trans i18nKey={`cosmos.delegation.commission`} />{" "}
            {`${Math.round(validator.commission * 10000) / 100} %`}
          </Text>
        </Box>
      }
    ></StyledValidatorRow>
  );
}
const StyledValidatorRow = styled(ValidatorRow)<ValidatorRowProps>`
  border-color: transparent;
  margin-bottom: 0;
`;
const ChosenMark = styled(Check).attrs<{
  active?: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))<{
  active?: boolean;
  size?: number;
}>``;
export default CosmosFamilyValidatorRow;

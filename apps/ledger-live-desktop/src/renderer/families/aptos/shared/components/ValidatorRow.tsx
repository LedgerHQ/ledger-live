import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { AptosValidator } from "@ledgerhq/live-common/families/aptos/types";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import ValidatorIcon from "~/renderer/families/aptos/shared/components/ValidatorIcon";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";

type Props = {
  currency: CryptoCurrency;
  validator: AptosValidator;
  active?: boolean;
  onClick: (a: { address: string }) => void;
  unit: Unit;
};

function AptosValidatorRow({ validator, active, onClick, unit, currency }: Readonly<Props>) {
  const explorerView = getDefaultExplorerView(currency);

  const onExternalLink = useCallback(
    (address: string) => {
      const srURL = explorerView && getAddressExplorer(explorerView, address);
      if (srURL) openURL(srURL);
    },
    [explorerView],
  );

  return (
    <StyledValidatorRow
      onClick={onClick}
      key={validator.address}
      validator={{
        address: validator.address,
      }}
      icon={<ValidatorIcon validatorAddress={validator.address} />}
      title={validator.address}
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
              {formatCurrencyUnit(unit, new BigNumber(validator.activeStake?.toString()), {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans color="neutral.c70" i18nKey="aptos.stake.totalStake" />
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
            <Trans i18nKey="aptos.stake.commission" />
            <Text
              style={{
                marginRight: 5,
                fontSize: 11,
              }}
            >{` ${validator.commission}%`}</Text>
            {!!validator.nextUnlockTime && (
              <>
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                  }}
                >
                  {"\u{1F512}"}
                </Text>
                <Text
                  style={{
                    marginLeft: 3,
                    fontSize: 11,
                  }}
                >
                  <Trans i18nKey="aptos.stake.nextUnlockIn" />
                </Text>
                <Text
                  style={{
                    marginLeft: 2,
                    fontSize: 11,
                  }}
                >{` ${validator.nextUnlockTime}`}</Text>
              </>
            )}
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

export default AptosValidatorRow;

import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import type { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { Flex, Icons } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import ValidatorRow from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import ValidatorIcon from "./ValidatorIcon";

type Props = {
  currency: CryptoCurrency;
  validator: HederaValidator;
  unit: Unit;
  active?: boolean;
  onClick: (validator: HederaValidator) => void;
};

function ValidatorListItem({ validator, active, unit, currency, onClick }: Readonly<Props>) {
  const { t } = useTranslation();
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
      key={validator.address}
      onClick={() => onClick(validator)}
      validator={{ address: validator.address }}
      icon={<ValidatorIcon validator={validator} />}
      title={t("hedera.delegation.flow.steps.validator.rowTitle", {
        name: validator.name,
        index: validator.nodeId,
      })}
      onExternalLink={onExternalLink}
      unit={unit}
      disabled={active}
      sideInfo={
        <Flex flexDirection="row">
          <Flex flexDirection="column">
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
              {formatCurrencyUnit(unit, new BigNumber(validator.activeStake.toString()), {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans color="palette.text.shade50" i18nKey="hedera.delegation.totalStake" />
            </Text>
          </Flex>
          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} size={14} />
          </Box>
        </Flex>
      }
      subtitle={
        <Box>
          <Text ff="Inter|Medium" fontSize={2} color="palette.text.shade50">
            {validator.overstaked ? (
              <Flex alignItems="center" columnGap={1} color="palette.warning.c70">
                <Icons.Warning size="XS" style={{ width: "10px" }} />
                <Text fontSize={2}>
                  {t("hedera.delegation.flow.steps.validator.rowSubtitleOverstaked")}
                </Text>
              </Flex>
            ) : (
              <Text fontSize={2}>
                {t("hedera.delegation.flow.steps.validator.rowSubtitlePercentage", {
                  percentage: validator.activeStakePercentage,
                })}
              </Text>
            )}
          </Text>
        </Box>
      }
    />
  );
}

const StyledValidatorRow = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
  &[disabled]:hover {
    border-color: transparent;
  }
`;

const ChosenMark = styled(Check).attrs<{
  active?: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))<{
  active?: boolean;
}>``;

export default ValidatorListItem;

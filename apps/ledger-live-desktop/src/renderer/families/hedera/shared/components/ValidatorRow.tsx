import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { Flex, Icons } from "@ledgerhq/react-ui";
import BigNumber from "bignumber.js";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import ValidatorIcon from "./ValidatorIcon";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";

type Props = {
  currency: CryptoCurrency;
  validator: HederaValidator;
  active?: boolean;
  onClick: (validator: HederaValidator) => void;
  unit: Unit;
};

function HederaValidatorRow({ validator, active, onClick, unit, currency }: Readonly<Props>) {
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
      onClick={() => onClick(validator)}
      key={validator.address}
      validator={{
        address: validator.address,
      }}
      icon={<ValidatorIcon validatorName={validator.name} />}
      title={t("hedera.stake.flow.steps.validator.rowTitle", {
        name: validator.name,
        index: validator.nodeId + 1,
      })}
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
              {formatCurrencyUnit(unit, new BigNumber(validator.activeStake.toString()), {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans color="palette.text.shade50" i18nKey="hedera.stake.totalStake" />
            </Text>
          </Box>
          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} size={14} />
          </Box>
        </Box>
      }
      subtitle={
        <Box>
          <Text ff="Inter|Medium" fontSize={2} color="palette.text.shade50">
            {validator.overstaked ? (
              <Flex alignItems="center" columnGap={1}>
                <Icons.Warning color="palette.warning.c70" size="XS" style={{ width: "10px" }} />
                <Text fontSize={2} color="palette.warning.c70">
                  {t("hedera.stake.flow.steps.validator.rowSubtitleOverstaked")}
                </Text>
              </Flex>
            ) : (
              <Text fontSize={2}>
                {t("hedera.stake.flow.steps.validator.rowSubtitlePercentage", {
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
`;

const ChosenMark = styled(Check).attrs<{
  active?: boolean;
}>(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))<{
  active?: boolean;
}>``;

export default HederaValidatorRow;

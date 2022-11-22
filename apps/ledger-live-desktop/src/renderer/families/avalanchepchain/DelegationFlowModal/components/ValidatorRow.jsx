// @flow
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { AvalanchePChainValidator } from "@ledgerhq/live-common/families/avalanchepchain/types";
import type { CryptoCurrency, Unit } from "@ledgerhq/live-common/types";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import type { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";
import ValidatorRow, { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import Logo from "~/renderer/icons/Logo";
import { isDefaultValidatorNode } from "@ledgerhq/live-common/families/avalanchepchain/utils";

type Props = {
  currency: CryptoCurrency,
  validator: AvalanchePChainValidator,
  active?: boolean,
  onClick?: (v: AvalanchePChainValidator) => void,
  unit: Unit,
};

function AvalancheValidatorRow({ validator, active, onClick, unit, currency }: Props) {
  const explorerView = getDefaultExplorerView(currency);

  const onExternalLink = useCallback(
    (address: string) => {
      const url = explorerView && getAddressExplorer(explorerView, address);

      if (url) {
        openURL(url);
      }
    },
    [explorerView],
  );

  return (
    <StyledValidatorRow
      onClick={onClick}
      key={validator.nodeID}
      validator={{ address: validator.nodeID, endTime: validator.endTime }}
      icon={
        <IconContainer isSR>
          {isDefaultValidatorNode(validator.nodeID) ? (
            <Logo size={16} />
          ) : (
            <FirstLetterIcon label={validator.nodeID.split("-")[1]} />
          )}
        </IconContainer>
      }
      title={isDefaultValidatorNode(validator.nodeID) ? `Ledger by Figment` : validator.nodeID}
      onExternalLink={onExternalLink}
      unit={unit}
      sideInfo={
        <Box style={{ flexDirection: "row" }}>
          <Box style={{ flexDirection: "column" }}>
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
              {formatCurrencyUnit(unit, validator.remainingStake, {
                showCode: true,
              })}
            </Text>
            <Text fontSize={2} textAlign="right">
              <Trans
                color="palette.text.shade50"
                i18nKey="avalanchepchain.delegation.validatorRemainingStake"
              />
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
            <Trans i18nKey={`avalanchepchain.delegation.commission`} />{" "}
            {`${validator.delegationFee} %`}
          </Text>
        </Box>
      }
    />
  );
}

const StyledValidatorRow: ThemedComponent<ValidatorRowProps> = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
`;

const ChosenMark: ThemedComponent<{ active: boolean }> = styled(Check).attrs(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))``;

export default AvalancheValidatorRow;

import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { rgba } from "~/renderer/styles/helpers";
import { CopiableField } from "~/renderer/drawers/NFTViewerDrawer/CopiableField";
import { useTranslation } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const Container = styled(Box)<{ selected?: boolean }>`
  padding: 16px 16px;
  cursor: pointer;
  border-radius: 4px;
  border: 2px solid ${p => (p.selected ? p.theme.colors.palette.primary.main : "transparent")};
  background: ${p => (p.selected ? rgba(p.theme.colors.palette.primary.main, 0.05) : "none")};
  transition: all 0.2s ease-in-out;

  &:hover {
    background: ${p => rgba(p.theme.colors.palette.primary.main, 0.03)};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ValidatorName = styled(Text)`
  margin-bottom: 4px;
  font-size: 16px;
`;

const ValidatorAddress = styled(Text)`
  opacity: 0.7;
`;

const StatsContainer = styled(Box)`
  text-align: right;
  min-width: 80px;
`;

const StatsValue = styled(Box)`
  display: flex;
  flex-direction: column;
  margin-bottom: 2px;
`;

const ValidatorRow = ({
  validator,
  selected,
  onClick,
}: {
  validator: {
    address: string;
    name: string;
    delegators: number;
    totalStake: number;
    fee: string;
  };
  selected: boolean;
  onClick: () => void;
}) => {
  const currency = getCryptoCurrencyById("mina");
  const { t } = useTranslation();

  return (
    <Container horizontal alignItems="center" selected={selected} onClick={onClick}>
      <Box flex={1} mr={4}>
        <ValidatorName ff="Inter|SemiBold" color="palette.text.shade100">
          {validator.name}
        </ValidatorName>
        <CopiableField value={validator.address}>
          <ValidatorAddress ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
            {validator.address}
          </ValidatorAddress>
        </CopiableField>
        <StatsValue>
          <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
            {validator.delegators} {t("mina.delegators")}
          </Text>
          <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
            {t("common.stake")}: {validator.totalStake} {currency.units[0].code}
          </Text>
        </StatsValue>
      </Box>

      <StatsContainer>
        <StatsValue ff="Inter|SemiBold" color="palette.text.shade100">
          {validator.fee}%
        </StatsValue>
        <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
          Fee
        </Text>
      </StatsContainer>
    </Container>
  );
};

export default ValidatorRow;

import React, { useCallback } from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
const ProviderContainer = styled(Box).attrs({
  horizontal: true,
  alignItems: "center",
  ff: "Inter|SemiBold",
})<{ selected?: boolean | null }>`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  cursor: pointer;
  ${p =>
    p.selected
      ? `
    border-color: ${p.theme.colors.palette.primary.main};
    box-shadow: 0px 0px 0px 4px ${p.theme.colors.primary.c60};
    background-color: ${p.theme.colors.primary.c20};
    `
      : `
    :hover {
      box-shadow: 0px 0px 2px 1px ${p.theme.colors.palette.divider};
    }`}
`;
const SecondaryText = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
`;
export type Props = {
  value: ExchangeRate;
  onSelect: (a: ExchangeRate) => void;
  selected?: boolean | null;
  icon?: string;
  title: string;
  subtitle: React.ReactNode;
  centerContainer?: JSX.Element;
  rightContainer: JSX.Element;
};
function Rate({
  value,
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  centerContainer,
  rightContainer,
}: Props) {
  const handleSelection = useCallback(() => onSelect(value), [value, onSelect]);
  return (
    <ProviderContainer
      p={3}
      mb={3}
      fontWeight="500"
      selected={selected}
      onClick={handleSelection}
      data-test-id={`quote-container-${value.provider}-${value.tradeMethod}`}
    >
      {icon && (
        <Box mr={2}>
          <ProviderIcon size="S" name={icon} />
        </Box>
      )}
      <Box flex={1}>
        <Box horizontal fontSize={4}>
          <Box width={175}>
            <Text fontWeight="600">{title}</Text>
            <Box>
              <SecondaryText fontSize={3}>{subtitle}</SecondaryText>
            </Box>
          </Box>
          <Box alignItems="flex-start" flex={1}>
            {centerContainer}
          </Box>
          <Box alignItems="flex-end" flex={1}>
            {rightContainer}
          </Box>
        </Box>
      </Box>
    </ProviderContainer>
  );
}
export default React.memo<Props>(Rate);

// @flow
import React, { useCallback } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { rgba } from "~/renderer/styles/helpers";
import { iconByProviderName } from "../../utils";

const ProviderContainer: ThemedComponent<{}> = styled(Box).attrs({
  horizontal: true,
  alignItems: "center",
  ff: "Inter|SemiBold",
})`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  cursor: pointer;
  ${p =>
    p.selected
      ? `
    border-color: ${p.theme.colors.palette.primary.main};
    box-shadow: 0px 0px 0px 4px ${rgba(p.theme.colors.palette.primary.main, 0.8)};
    background-color: ${rgba(p.theme.colors.palette.primary.main, 0.2)};
    `
      : `
    :hover {
      box-shadow: 0px 0px 2px 1px ${p.theme.colors.palette.divider};
    }`}
`;

export type Props = {
  value?: ExchangeRate,
  onSelect: ExchangeRate => void,
  selected?: boolean,
  icon?: string,
  title: string,
  subtitle: string,
  centerContainer?: JSX.Element,
  rightContainer: JSX.Element,
};

function Rate({
  value = {},
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  centerContainer,
  rightContainer,
}: Props) {
  const handleSelection = useCallback(() => onSelect(value), [value, onSelect]);
  const ProviderIcon = iconByProviderName[icon];
  return (
    <ProviderContainer p={3} mb={3} fontWeight="500" selected={selected} onClick={handleSelection}>
      {icon && (
        <Box mr={2}>
          <ProviderIcon size={28} />
        </Box>
      )}
      <Box flex={1}>
        <Box horizontal color="palette.text.shade100" fontSize={4}>
          <Box flex={1}>
            <Text fontWeight="600">{title}</Text>
            <Box>
              <Text fontSize={3} color="palette.text.shade40">
                {subtitle}
              </Text>
            </Box>
          </Box>
          <Box alignItems="center" flex={1}>
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

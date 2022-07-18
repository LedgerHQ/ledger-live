// @flow

import styled from "styled-components";
import ValidatorRow, { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import Check from "~/renderer/icons/Check";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";

export const Status: ThemedComponent<{ type?: string }> = styled(Text)`
  font-size: 11px;
  font-weight: 700;
  color: ${p =>
    p.type === "active" ? p.theme.colors.positiveGreen : p.theme.colors.palette.text.shade60};
`;

export const StyledValidatorRow: ThemedComponent<ValidatorRowProps> = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
`;

export const ChosenMark: ThemedComponent<{ active: boolean }> = styled(Check).attrs(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))``;

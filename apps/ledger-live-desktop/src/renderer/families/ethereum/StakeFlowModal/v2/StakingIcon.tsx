import React from "react";
import { CryptoIcon, Icon, ProviderIcon } from "@ledgerhq/react-ui";
import styled from "styled-components";

type Props = {
  icon: string;
};

const IconContainer = styled.div(
  ({ theme }) => `
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${theme.space[6]}px;
  height: ${theme.space[6]}px;
  border-radius: 100%;
  background-color: ${theme.colors.opacityDefault.c05};
  margin-top: ${theme.space[3]}px;
`,
);

const ProviderIconContainer = styled.div(
  ({ theme }) => `
  margin-top: ${theme.space[3]}px;
`,
);

export function StakingIcon({ icon }: Props) {
  if (!icon) return null;

  const [iconType, iconName] = icon.split(":");

  // if no icon name then no iconType defined, and iconType can be treated as iconName.
  if (!iconName) {
    return (
      <IconContainer>
        <Icon name={iconType} size={14} />
      </IconContainer>
    );
  }

  if (iconType === "crypto") {
    return <CryptoIcon name={iconName} size={40} />;
  }
  if (iconType === "provider") {
    return (
      <ProviderIconContainer>
        <ProviderIcon name={iconName} size="S" />
      </ProviderIconContainer>
    );
  }

  return null;
}

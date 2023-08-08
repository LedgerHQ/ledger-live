import React from "react";
import { CryptoIcon, Icon, ProviderIcon } from "@ledgerhq/react-ui";
import styled from "styled-components";

type Props = {
  icon?: string;
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
  margin-top: ${theme.space[1]}px;
`,
);

export function StakingIcon({ icon }: Props) {
  if (!icon) {
    return null;
  }

  const [iconName, iconType] = icon.split(":");

  // if no icon type then treat as "normal" icon.
  if (!iconType) {
    return (
      <IconContainer>
        <Icon name={iconName} size={14} />
      </IconContainer>
    );
  }

  if (iconType === "crypto") {
    return <CryptoIcon name={iconName} size={40} />;
  }
  if (iconType === "provider") {
    return (
      <ProviderIconContainer>
        <ProviderIcon name={iconName} size="S" boxed={true} />
      </ProviderIconContainer>
    );
  }

  return null;
}

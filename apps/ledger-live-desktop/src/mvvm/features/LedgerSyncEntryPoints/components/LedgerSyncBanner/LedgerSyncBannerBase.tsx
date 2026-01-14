import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";

const BannerContainer = styled(Flex)`
  background-color: ${p => p.theme.colors.background.card};
  border-radius: 12px;
  padding: 12px;
  align-items: center;
  gap: 12px;
  margin-bottom: 9px;
`;

const IconContainer = styled(Flex)`
  position: relative;
`;

const RedDot = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${p => p.theme.colors.error.c50};
  border: 2px solid ${p => p.theme.colors.background.card};
`;

const ContentContainer = styled(Flex)`
  flex-direction: column;
  flex: 1;
`;

type LedgerSyncBannerBaseProps = {
  icon: ReactNode;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  onPress: () => void;
  renderButton: (ctaText: string, onPress: () => void) => ReactNode;
  iconContainerStyle?: React.CSSProperties;
};

export function LedgerSyncBannerBase({
  icon,
  titleKey,
  descriptionKey,
  ctaKey,
  onPress,
  renderButton,
  iconContainerStyle,
}: LedgerSyncBannerBaseProps) {
  const { t } = useTranslation();

  return (
    <BannerContainer>
      <IconContainer style={iconContainerStyle}>
        {icon}
        <RedDot />
      </IconContainer>
      <ContentContainer>
        <Text variant="h4Inter" fontSize={16} fontWeight="600" color="neutral.c100">
          {t(titleKey)}
        </Text>
        <Text variant="small" fontSize={13} fontWeight="500" color="neutral.c70">
          {t(descriptionKey)}
        </Text>
      </ContentContainer>
      {renderButton(t(ctaKey), onPress)}
    </BannerContainer>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

type Props = {
  color: string;
  focused: boolean;
  i18nKey: string;
  Icon: (props: { size?: number; color?: string }) => React.ReactElement;
};

const TabIconContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-top: ${p => p.theme.space[2]}px;
`;

export default function TabIcon({ Icon, i18nKey, color }: Props) {
  const { t } = useTranslation();
  return (
    <TabIconContainer>
      <Icon size={24} color={color} />
      <Text
        numberOfLines={1}
        fontWeight="semiBold"
        variant="tiny"
        textAlign="center"
        pt={2}
        color={color}
      >
        {t(i18nKey)}
      </Text>
    </TabIconContainer>
  );
}

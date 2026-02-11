import React from "react";
import { useTranslation } from "~/context/Locale";
import { Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

type Props = {
  color: string;
  i18nKey: string;
  testID?: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const TabIconContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export default function TabIcon({ Icon, i18nKey, color, testID }: Props) {
  const { t } = useTranslation();
  return <Icon color={color} />;
}

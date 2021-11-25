import React from "react";
import styled, { useTheme } from "styled-components/native";
import Text from "../../Text";
import { ArrowsHMedium } from "@ledgerhq/icons-ui/native";

export const MinMaxTextContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 6px;
  padding-left: 10px;
  padding-right: 10px;
  width: 100%;
`;

export const Notch = styled.View`
  height: 16px;
`;

export const RailSelected = styled.View`
  margin-left: -5px;
  margin-right: -5px;
  height: 40px;
  background-color: ${(p) => p.theme.colors.primary.c40};
  border-radius: 30px;
`;

export const Rail = styled.View`
  flex: 1;
  height: 40px;
  background-color: ${(p) => p.theme.colors.neutral.c30};
  border-radius: 30px;
`;

const ThumbContainer = styled.View`
  height: 40px;
  width: 40px;
  background-color: ${(p) => p.theme.colors.primary.c90};
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Thumb = () => {
  const { colors } = useTheme();
  return (
    <ThumbContainer>
      <ArrowsHMedium color={colors.neutral.c00} size={24} />
    </ThumbContainer>
  );
};

const LabelContainer = styled.View`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3.5px 6px;
  background-color: ${(p) => p.theme.colors.primary.c20};
  border-radius: 4px;
`;

export const Label = ({ children }: { children: React.ReactNode }) => {
  return (
    <LabelContainer>
      <Text variant={"body"} fontWeight={"semiBold"} color={"primary.c90"}>
        {children}
      </Text>
    </LabelContainer>
  );
};

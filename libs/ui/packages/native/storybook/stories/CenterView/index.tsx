import React, { useState } from "react";
import { useFonts } from "expo-font";
import styled from "styled-components/native";
import PropTypes from "prop-types";
import { StyleProvider } from "../../../src/styles/StyleProvider";

export const Main = styled.View`
  flex: 1;
  width: 100%;
  padding: 5%;
  justify-content: center;
  align-items: center;
  background-color: ${(p) => p.theme.colors.background.main};
  overflow: hidden;
`;

const ThemeButton = styled.TouchableOpacity`
  width: ${(p) => p.theme.space[10]}px;
  height: ${(p) => p.theme.space[10]}px;
  border-top-left-radius: ${(p) => p.theme.space[10]}px;
  border-bottom-left-radius: ${(p) => p.theme.space[10]}px;
  background-color: ${(p) => p.theme.colors.neutral.c100};
  justify-content: center;
  align-items: center;
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 1000;
`;

const Icon = styled.Text`
  color: ${(p) => p.theme.colors.neutral.c100};
  font-size: 15px;
`;

export function FontProvider({
  waitUntilLoaded,
  children,
}: {
  waitUntilLoaded?: boolean;
  children: JSX.Element;
}) {
  const [loaded] = useFonts({
    "HMAlphaMono-Medium": require("../../../src/assets/fonts/alpha/HMAlphaMono-Medium.otf"),
    "Inter-Medium": require("../../../src/assets/fonts/inter/Inter-Medium.otf"),
    "Inter-SemiBold": require("../../../src/assets/fonts/inter/Inter-SemiBold.otf"),
    "Inter-Bold": require("../../../src/assets/fonts/inter/Inter-Bold.otf"),
  });

  if (waitUntilLoaded && !loaded) {
    return null;
  }

  return children;
}

// container for stories hosted on expo
export default function CenterView({
  waitFonts,
  children,
}: {
  waitFonts?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  const [isLight, setIsLight] = useState(true);

  return (
    <StyleProvider selectedPalette={isLight ? "light" : "dark"}>
      <ThemeButton onPress={() => setIsLight(!isLight)}>
        <Icon>🖌️</Icon>
      </ThemeButton>
      <FontProvider waitUntilLoaded={waitFonts}>
        <Main>{children}</Main>
      </FontProvider>
    </StyleProvider>
  );
}

CenterView.defaultProps = {
  children: null,
};

CenterView.propTypes = {
  children: PropTypes.node,
};

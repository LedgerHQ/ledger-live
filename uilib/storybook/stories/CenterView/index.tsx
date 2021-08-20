import React, { useState } from "react";
import styled from "styled-components/native";
import PropTypes from "prop-types";
import StyleProvider from "@ui/styles/StyleProvider";
import FontProvider from "@ui/providers/FontProvider";

const Main = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${p => p.theme.colors.palette.background.default};
  overflow: scroll;
`;

const ThemeButton = styled.TouchableOpacity`
  width: ${p => p.theme.space[6]}px;
  height: ${p => p.theme.space[6]}px;
  border-top-left-radius: ${p => p.theme.space[6]};
  border-bottom-left-radius: ${p => p.theme.space[6]};
  background-color: ${p => p.theme.colors.palette.text.default};
  justify-content: center;
  align-items: center;
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 1000;
`;

const Icon = styled.Text`
  color: ${p => p.theme.colors.palette.text.default};
  font-size: 15px;
`;

export default function CenterView({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLight, setIsLight] = useState(true);
  return (
    <FontProvider>
      <StyleProvider selectedPalette={isLight ? "light" : "dark"}>
        <ThemeButton onPress={() => setIsLight(!isLight)}>
          <Icon>🖌️</Icon>
        </ThemeButton>
        <Main>{children}</Main>
      </StyleProvider>
    </FontProvider>
  );
}

CenterView.defaultProps = {
  children: null,
};

CenterView.propTypes = {
  children: PropTypes.node,
};

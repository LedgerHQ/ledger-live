import React from "react";
import { DefaultTheme, ThemeProvider } from "styled-components";
import theme, { colors } from "~/renderer/styles/theme";
import palette from "~/renderer/styles/palettes";
import "~/renderer/i18n/init";
import TriggerAppReady from "~/renderer/components/TriggerAppReady";
import RenderError from "~/renderer/components/RenderError";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";

// Like App except it just render an error

const themePalette = palette.light;
const lightLiveTheme: DefaultTheme = {
  ...theme,
  colors: {
    ...colors,
    palette: themePalette,
  },
} as unknown as DefaultTheme;
const App = ({ error }: { error: Error }) => (
  <LiveStyleSheetManager>
    <ThemeProvider theme={lightLiveTheme}>
      <RenderError withoutAppData error={error}>
        <TriggerAppReady />
      </RenderError>
    </ThemeProvider>
  </LiveStyleSheetManager>
);
export default App;

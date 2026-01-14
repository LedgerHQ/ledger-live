import React from "react";
import { DefaultTheme, ThemeProvider } from "styled-components";
import theme, { colors } from "~/renderer/styles/theme";
import "~/renderer/i18n/init";
import TriggerAppReady from "~/renderer/components/TriggerAppReady";
import RenderError from "~/renderer/components/RenderError";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";
import { palettes as v3Palettes } from "@ledgerhq/react-ui/styles/index";

// Like App except it just render an error

const lightLiveTheme: DefaultTheme = {
  ...theme,
  colors: {
    ...v3Palettes.light,
    ...colors,
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

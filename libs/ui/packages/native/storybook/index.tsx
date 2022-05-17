import React from "react";
import { getStorybookUI, configure, addDecorator } from "@storybook/react-native";
import "./rn-addons";
import { withKnobs } from "@storybook/addon-knobs";
import CenterView from "./stories/CenterView";

const ledgerTheme = {
  backgroundColor: "hsla(0, 0%, 96%, 1)",
  headerTextColor: "hsla(0, 0%, 0%, 1)",
  labelColor: "hsla(0, 0%, 0%, 1)",
  borderColor: "hsla(0, 0%, 76%, 1)",
  previewBorderColor: "hsla(0, 0%, 76%, 1)",
  buttonTextColor: "hsla(0, 0%, 0%, 1)",
  buttonActiveTextColor: "hsla(273, 100%, 81%, 1)",
};

// enables knobs for all stories
// (putting any type because bindings are incorrect)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
addDecorator((Story: any) => {
  return (
    <CenterView waitFonts={false}>
      <Story />
    </CenterView>
  );
});
addDecorator(withKnobs);

// import stories
configure(() => {
  require("./stories");
}, module);

// Refer to https://github.com/storybookjs/storybook/tree/master/app/react-native#start-command-parameters
// To find allowed options for getStorybookUI
const StorybookUIRoot = getStorybookUI({
  asyncStorage: null,
  theme: ledgerTheme,
});

export default StorybookUIRoot;

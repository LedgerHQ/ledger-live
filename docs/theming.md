## UI Theming 🎨

LLM can be themed using two profiles

- `light`
- `dark`

Each profile contains a set of colors that are used in all the app and can be found [here](../src/colors.js).

### **_Tools_**

In order to theme the app we use [react-navigation](https://reactnavigation.org/docs/themes/) ThemeProvider
using either one of those methods to load the colors in the app:

- [useTheme hook](https://reactnavigation.org/docs/themes/#using-the-current-theme-in-your-own-components) provides colors and if theme is dark indication

```javascript
import React from "react";
import { useTheme } from "@react-navigation/native";

export default function() {
  const { colors, dark } = useTheme();

  return <View style={{ backgroundColor: colors.background }} />;
}
```

- [withTheme HOC](../src/colors.js#L37)

```javascript
import React from "react";
import { withTheme } from "../colors";

class ThemedView extends Component() {
  render() {
    const { colors } = this.props;

    return <View style={{ backgroundColor: colors.background }} />;
  }
}

export default withTheme(ThemedView);
```

**Colors in app should always be inlined**, heres a quick list of style props that should be themed:

- color
- backgroundColor
- borderColor
- shadowColor
- stroke (svg)
- fill (svg)

In addition to these tools some components handle theming by themselves using color props without the need of importing the theme from the provider:

- [LText](../src/components/LText/index.js) use `color` prop to target a specific theme color
  it will default to `colors.darkBlue`

```javascript
import LText from "../components/LText";

export default function App() {
  return <LText color="live">some text</LText>;
}
```

- [Button](../src/components/Button.js) use `type` prop to target a specific themes button type
- more to come...

### **_Theme conventions_**

While developping we try to keep the app theme coherent by setting the same colors at the same spots:

- use `colors.background` for background of the pages
- use `colors.card` for foreground containers
- use `colors.lightLive` for live background overlay

```javascript
import React from "react";
import { SafeAreaView } from "react-native";

export default function App() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        ...
      </View>
    </SafeAreaView>
  );
}
```

- use `colors.darkBlue` for contrast text color
- use `colors.grey` for lower contrast text color
- use `colors.fog` for light contrast borders

most of the other themed colors don't change between themes and are usually safe to use this includes:

- `colors.live` primary color
- `colors.alert` error color
- `colors.success` success color
- `colors.orange` warning color

### **Migration from previous versions**

in order to migrate from previous colors you need to follow these steps:

- remove all import references of

```JS
import colors from "./colors";
```

- use `color` prop on LText components if needed
- move all color props from StyleSheet definitions to inline styling.
- use the `useTheme` hook or `withTheme` HOC to import colors instead if needed.
- if you updated a new navigation router file, refer to other ones in order to check how we handle styling of headers there.
- do a lint on the app to make sure everything is imported correctly and run it.

after these steps everything should run correctly with potential color adjustments, **remember to try your page on the three themes**.

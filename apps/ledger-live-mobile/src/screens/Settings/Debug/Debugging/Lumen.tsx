import React, { useState } from "react";
import NavigationScrollView from "~/components/NavigationScrollView";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Banner, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { View } from "react-native";

export default function DebugLumen() {
  const styles = useStyleSheet(
    theme => ({
      root: {
        padding: theme.spacings.s16,
        display: "flex",
        flex: 1,
        gap: theme.spacings.s16,
      },
    }),
    [],
  );

  const [name, setName] = useState("");

  return (
    <NavigationScrollView>
      <View style={styles.root}>
        <Banner title="Lumen playground for testing Lumen components." />
        <TextInput placeholder="Enter your name" value={name} onChangeText={setName} />
      </View>
    </NavigationScrollView>
  );
}

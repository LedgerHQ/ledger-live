import { Button, Text } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import { useUnacceptGeneralTerms } from "~/logic/terms";

export default function DebugTermsOfUse() {
  const unAccept = useUnacceptGeneralTerms();
  useEffect(() => {
    unAccept();
  }, [unAccept]);

  return (
    <View style={styles.wrapper}>
      <Text variant="large">
        To display again, just click on the reset button and return to the page
      </Text>
      <Button mt={3} type="main" onPress={unAccept}>
        Reset
      </Button>
      <CheckTermOfUseUpdate />
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    padding: 20,
  },
  button: {
    marginTop: 20,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 12,
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 13,
    paddingRight: 16,
  },
});

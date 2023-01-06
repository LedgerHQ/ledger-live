import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Alert } from "@ledgerhq/native-ui";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import RequiresBLE from "../../../../components/RequiresBLE";

export default function DebugPermissions() {
  return (
    <NavigationScrollView>
      <Flex style={styles.root}>
        <RequiresBLE>
          <Alert type="info" title={"We have all the permissions"} />
        </RequiresBLE>
      </Flex>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});

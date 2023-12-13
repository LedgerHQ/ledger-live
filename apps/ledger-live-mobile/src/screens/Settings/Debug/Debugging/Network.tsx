import React, { useEffect, useReducer } from "react";
import { StyleSheet } from "react-native";
import { Flex, Text, Alert } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { useTheme } from "@react-navigation/native";

import {
  troubleshootOverObservable,
  troubleshootOverObservableReducer,
} from "@ledgerhq/live-common/network-troubleshooting/index";
import NavigationScrollView from "~/components/NavigationScrollView";

const Bullet = styled(Flex).attrs((p: { backgroundColor: string }) => ({
  backgroundColor: p.backgroundColor,
}))`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  margin: 0 8px;
`;

export default function Network() {
  const { colors } = useTheme();
  const [state, dispatch] = useReducer(troubleshootOverObservableReducer, []);

  useEffect(() => {
    const s = troubleshootOverObservable().subscribe(dispatch);
    return () => s.unsubscribe();
  }, []);

  return (
    <NavigationScrollView>
      <Flex style={styles.root}>
        <Alert
          title="This screen is testing we can access our explorers, websockets, status and apis"
          type="info"
        />
        {state.map(({ title, status }) => (
          <Flex flexDirection="row" key={title} alignItems="center" mt={4}>
            <Bullet backgroundColor={status === "success" ? colors.success : colors.alert} />
            <Text variant="body">{title}</Text>
          </Flex>
        ))}
      </Flex>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});

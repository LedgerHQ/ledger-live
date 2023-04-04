import { Flex, Icon } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { RefObject } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";

type RightHeaderProps = {
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
  handlePressInfo?: () => void;
};

export function RightHeader({ handlePressInfo }: RightHeaderProps) {
  const navigation = useNavigation();

  return (
    <>
      <View style={styles.headerRight}>
        {handlePressInfo ? (
          <TouchableOpacity onPress={handlePressInfo}>
            <Flex
              alignItems="center"
              justifyContent="center"
              height={40}
              width={40}
            >
              <Icon name="Info" color="neutral.c100" size={20} />
            </Flex>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={navigation.goBack}>
          <Flex
            alignItems="center"
            justifyContent="center"
            height={40}
            width={40}
          >
            <Icon name="Close" color="neutral.c100" size={20} />
          </Flex>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
  },
});

import React, { PureComponent } from "react";
import { StyleSheet, Share } from "react-native";
import { Icons, Text } from "@ledgerhq/native-ui";
import Touchable from "./Touchable";
import { withTheme } from "../colors";

type Props = {
  children: React.ReactNode;
  value: string;
};

class ShareLink extends PureComponent<Props> {
  onPress = async () => {
    const { value } = this.props;
    await Share.share({
      message: value,
    });
  };

  render() {
    const { children } = this.props;
    return (
      <Touchable event="ShareLink" style={styles.linkContainer} onPress={this.onPress}>
        <Icons.ShareMedium size={16} color="primary.c80" />
        <Text variant="body" fontWeight="semiBold" color="primary.c80" ml={3}>
          {children}
        </Text>
      </Touchable>
    );
  }
}

export default withTheme(ShareLink);
const styles = StyleSheet.create({
  linkContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
});

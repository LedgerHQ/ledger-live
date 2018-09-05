// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import colors from "../../colors";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import ArrowRight from "../../images/icons/ArrowRight";

const iconByType = {
  ble: "bluetooth",
  usb: "usb",
  httpdebug: "terminal",
};

class SelectDeviceItem extends PureComponent<{
  id: string,
  name: string,
  type: string,
  onSelectItem: string => void,
}> {
  onPress = () => {
    this.props.onSelectItem(this.props.id);
  };
  render() {
    const { name, type } = this.props;
    return (
      <Touchable onPress={this.onPress}>
        <View style={styles.root}>
          <Icon name={iconByType[type]} size={20} color={colors.smoke} />
          <LText style={styles.name} numberOfLines={1}>
            {name}
          </LText>
          <View style={styles.arrow}>
            <ArrowRight size={16} color={colors.grey} />
          </View>
        </View>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 40,
  },
  name: {
    color: colors.smoke,
    flex: 1,
  },
  arrow: {},
});

export default SelectDeviceItem;

import React from "react";
import { StyleSheet, Image, View } from "react-native";

type Props = {
  left: React.ReactNode;
  right: React.ReactNode;
  undelegation?: boolean;
};
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 16,
  },
  delegationImage: {
    width: 96,
    height: 49,
    margin: 10,
  },
  undelegationImage: {
    width: 96,
    height: 26,
    margin: 10,
  },
});

const DelegatingContainer = ({ left, right, undelegation }: Props) => (
  <View style={styles.header}>
    {left}
    <Image
      style={undelegation ? styles.undelegationImage : styles.delegationImage}
      source={undelegation ? require("./undelegation.png") : require("./delegation.png")}
    />
    {right}
  </View>
);

export default DelegatingContainer;

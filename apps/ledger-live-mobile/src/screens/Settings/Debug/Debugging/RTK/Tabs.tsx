import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import useStyles from "./style";
import { Section } from "./types";

type TabsProps = {
  active: Section;
  onChange: (key: Section) => void;
  containerStyle?: ViewStyle;
};

export default function Tabs({ active, onChange, containerStyle }: TabsProps) {
  const styles = useStyles();
  return (
    <Flex style={[styles.tabsRow, containerStyle]}>
      <TouchableOpacity
        style={[styles.tab, active === "api" && styles.tabSelected]}
        onPress={() => onChange("api")}
      >
        <Text style={[styles.tabLabel, active === "api" && styles.tabLabelSelected]}>API</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, active === "slice" && styles.tabSelected]}
        onPress={() => onChange("slice")}
      >
        <Text style={[styles.tabLabel, active === "slice" && styles.tabLabelSelected]}>Slices</Text>
      </TouchableOpacity>
    </Flex>
  );
}

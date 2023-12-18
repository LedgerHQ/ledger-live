import React, { useState } from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { Text, IconsLegacy, Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { isEmpty } from "lodash";
import { State } from "~/reducers/types";
import Touchable from "~/components/Touchable";

const StyledTouchable = styled(Touchable)`
  background-color: ${p => p.theme.colors.palette.background.main};
  padding: ${p => p.theme.space[5]}px ${p => p.theme.space[4]}px;
  flex-direction: row;
  align-items: center;
  border-bottom-color: ${p => p.theme.colors.palette.neutral.c40};
  border-bottom-width: 1px;
`;

type LeafProps = {
  value: unknown;
  path: string;
  label: string;
  onPress: (key: string, type?: string) => void;
  icon: React.ReactNode;
};

const Leaf = ({ path, label, value, onPress, icon }: LeafProps) => (
  <StyledTouchable
    onPress={() => {
      onPress(path, typeof value);
    }}
  >
    <Flex paddingRight={6}>{icon}</Flex>
    <Flex flexDirection="column">
      {label ? (
        <Text variant={"body"} fontWeight={"semiBold"} color={"neutral.c70"}>
          {`${label}`}
        </Text>
      ) : null}
      {value !== undefined && (
        <Flex flexDirection="column">
          <Text variant={"small"} fontWeight={"medium"} color={"neutral.c70"}>
            {`${typeof value}`}
          </Text>
          <Text mt={3} variant={"body"} fontWeight={"medium"} color={"neutral.c90"} selectable>
            {`${value}`}
          </Text>
        </Flex>
      )}
    </Flex>
  </StyledTouchable>
);

type Props = {
  data: Partial<{ [key in keyof State]: unknown }>;
  path?: string;
  onEdit: (path: string, type?: string) => void;
};

// Nb Could be extended to _delete_ entries and _add_ them instead of just modifying
// existing ones. But I don't have the energy to do that right now, so go ahead, do it.
const Node = ({ data = {}, path, onEdit }: Props) => {
  const { colors } = useTheme();
  const [childVisibility, setChildVisibility] = useState<{
    [path: string]: boolean;
  }>({});

  const toggleVisibility = (path: string) => {
    setChildVisibility((prev: { [path: string]: boolean }) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  return (
    <View>
      {Object.keys(data || {}).map(key => {
        const rowKey = path ? `${path}.${key}` : key;
        const value = data[key as keyof State];
        const isObject = typeof value === "object";
        const empty = isEmpty(value);
        const isOpen = childVisibility[rowKey as keyof typeof childVisibility];
        const icon = isObject ? (
          empty ? (
            <IconsLegacy.BracketsMedium size={18} />
          ) : isOpen ? (
            <IconsLegacy.DropdownMedium size={18} />
          ) : (
            <IconsLegacy.DroprightMedium size={18} />
          )
        ) : (
          <IconsLegacy.PenMedium size={18} />
        );

        return (
          <View
            key={rowKey}
            style={[styles.wrapper, { borderColor: colors.black, borderLeftWidth: path ? 5 : 0 }]}
          >
            <Leaf
              onPress={isObject ? toggleVisibility : onEdit}
              path={rowKey}
              icon={icon}
              label={key}
              value={isObject ? undefined : value}
            />

            {isObject
              ? isOpen &&
                value && (
                  <Node data={value as Record<string, unknown>} path={rowKey} onEdit={onEdit} />
                )
              : null}
          </View>
        );
      })}
    </View>
  );
};

export default Node;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderLeftWidth: 5,
  },
  buttonStyle: {
    marginBottom: 16,
  },
  header: {
    padding: 8,
    flex: 1,
  },
  value: {
    padding: 8,
    opacity: 0.7,
  },
  input: {
    fontSize: 16,
    padding: 16,
  },
});

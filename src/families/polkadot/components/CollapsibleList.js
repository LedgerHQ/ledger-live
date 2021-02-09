// @flow
import { useTheme } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";

import Icon from "react-native-vector-icons/dist/FontAwesome";

import Button from "../../../components/Button";

type Props = {
  children?: React$Node,
  uncollapsedItems: Array<any>,
  collapsedItems: Array<any>,
  renderItem: (item: any, index: number, isLast: boolean) => React$Node,
  renderShowMore: (collapsed: boolean) => React$Node,
};

const CollapsibleList = ({
  children,
  uncollapsedItems,
  collapsedItems,
  renderItem,
  renderShowMore,
}: Props) => {
  const { colors } = useTheme();
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(collapsed => !collapsed);
  }, []);

  return (
    <>
      <View
        style={[
          styles.list,
          {
            backgroundColor: colors.card,
            ...Platform.select({
              ios: {
                shadowColor: colors.black,
              },
            }),
          },
          !!collapsedItems.length && collapsed && styles.elevated,
        ]}
      >
        {children}
        {uncollapsedItems.map((item, i) =>
          renderItem(item, i, collapsed && i === uncollapsedItems.length - 1),
        )}
        {collapsedItems.length !== 0 ? (
          <>
            <View style={[collapsed ? styles.hidden : styles.visible]}>
              {collapsedItems.map((item, i) =>
                renderItem(item, i, i === collapsedItems.length - 1),
              )}
            </View>
            <View
              style={[styles.showMore, { borderTopColor: colors.lightGrey }]}
            >
              <Button
                type="lightSecondary"
                event="CollapsedListShowMore"
                title={renderShowMore(collapsed)}
                IconRight={() => (
                  <View style={styles.buttonIcon}>
                    <Icon
                      color={colors.live}
                      name={collapsed ? "angle-down" : "angle-up"}
                      size={16}
                    />
                  </View>
                )}
                onPress={toggleCollapsed}
                size={13}
              />
            </View>
          </>
        ) : null}
      </View>
      {!!collapsed && collapsedItems.length ? (
        <View
          style={[
            styles.showMoreIndicator,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.lightGrey,
              ...Platform.select({
                ios: {
                  shadowColor: colors.black,
                },
              }),
            },
          ]}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  list: {
    zIndex: 2,
    borderRadius: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  elevated: {
    elevation: 2,
  },
  visible: {
    display: "flex",
  },
  hidden: {
    display: "none",
  },
  showMoreIndicator: {
    zIndex: 1,
    height: 7,
    marginRight: 5,
    marginLeft: 5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderTopWidth: 1,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: {
          height: 2,
        },
      },
    }),
  },
  showMore: {
    borderTopWidth: 1,
  },
  buttonIcon: { paddingLeft: 6 },
});

export default React.memo<Props>(CollapsibleList);

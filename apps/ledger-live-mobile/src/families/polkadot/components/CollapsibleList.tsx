import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";

import { DropdownMedium, DropupMedium } from "@ledgerhq/native-ui/assets/icons";
import Button from "~/components/wrappedUi/Button";

type Props<Item> = {
  children?: React.ReactNode;
  uncollapsedItems: Array<Item>;
  collapsedItems: Array<Item>;
  renderItem: (item: Item, index: number, isLast: boolean) => React.ReactNode;
  renderShowMore: (collapsed: boolean) => React.ReactNode;
};

const CollapsibleList = <Item,>({
  children,
  uncollapsedItems,
  collapsedItems,
  renderItem,
  renderShowMore,
}: Props<Item>) => {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(collapsed => !collapsed);
  }, []);

  return (
    <>
      <View style={[styles.list, !!collapsedItems.length && collapsed && styles.elevated]}>
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
            <View>
              <Button
                type={"shade"}
                outline
                event="CollapsedListShowMore"
                Icon={collapsed ? DropdownMedium : DropupMedium}
                iconPosition={"right"}
                onPress={toggleCollapsed}
                size={"medium"}
                mt={3}
              >
                {renderShowMore(collapsed)}
              </Button>
            </View>
          </>
        ) : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  list: {},
  elevated: {},
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
  },
  showMore: {
    borderTopWidth: 1,
  },
  buttonIcon: { paddingLeft: 6 },
});

export default React.memo(CollapsibleList) as typeof CollapsibleList;

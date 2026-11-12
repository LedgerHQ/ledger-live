import React, { createContext, useContext, type ReactNode } from "react";
import { Pressable, View } from "react-native";

type MockItem = Readonly<{ value: string; label: string }>;
type MockSelectListProps = Readonly<{
  items: readonly MockItem[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  children: ReactNode;
}>;

const ItemsContext = createContext<MockSelectListProps | null>(null);

/** The Lumen stub never calls `renderItem` nor selects a row, so these stand in for the list. */
export function MockSelectList(props: MockSelectListProps) {
  return <ItemsContext.Provider value={props}>{props.children}</ItemsContext.Provider>;
}

export function MockSelectListContent({
  renderItem,
}: Readonly<{ renderItem: (item: MockItem) => ReactNode }>) {
  const list = useContext(ItemsContext);
  return <View>{list?.items.map(item => renderItem(item))}</View>;
}

export function MockSelectListItem({
  value,
  children,
  ...props
}: Readonly<{ value: string; children: ReactNode; testID?: string; accessibilityLabel?: string }>) {
  const list = useContext(ItemsContext);
  return (
    <Pressable
      {...props}
      accessibilityState={{ selected: list?.value === value }}
      onPress={() => list?.onValueChange?.(value)}
    >
      {children}
    </Pressable>
  );
}

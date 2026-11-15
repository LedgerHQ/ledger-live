import React, { createContext, useContext, type ReactNode } from "react";
import { Pressable, Text, View, type TextInputProps } from "react-native";

type MockItem = Readonly<{ value: string; label: string }>;
type MockSelectListProps = Readonly<{
  items: readonly MockItem[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  filter?: (item: MockItem, query: string) => boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  children: ReactNode;
}>;
type MockSelectListContext = MockSelectListProps & Readonly<{ visibleItems: readonly MockItem[] }>;

const ItemsContext = createContext<MockSelectListContext | null>(null);

/** The Lumen stub never calls `renderItem` nor selects a row, so these stand in for the list. */
export function MockSelectList(props: MockSelectListProps) {
  const { items, filter, searchValue = "" } = props;
  const visibleItems = filter ? items.filter(item => filter(item, searchValue)) : items;
  return (
    <ItemsContext.Provider value={{ ...props, visibleItems }}>
      {props.children}
    </ItemsContext.Provider>
  );
}

export function MockSelectListContent({
  renderItem,
}: Readonly<{ renderItem: (item: MockItem) => ReactNode }>) {
  const list = useContext(ItemsContext);
  return <View>{list?.visibleItems.map(item => renderItem(item))}</View>;
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

/** The core react-native stub has no `TextInput`, so render the host element Testing Library types into. */
export function MockSelectListSearch(props: Omit<TextInputProps, "value" | "onChangeText">) {
  const list = useContext(ItemsContext);
  return React.createElement("TextInput", {
    ...props,
    value: list?.searchValue ?? "",
    onChangeText: list?.onSearchValueChange,
  });
}

export function MockSelectListEmptyState({
  title,
  testID,
}: Readonly<{ title: string; testID?: string }>) {
  const list = useContext(ItemsContext);
  if (list?.visibleItems.length) return null;
  return <Text testID={testID}>{title}</Text>;
}

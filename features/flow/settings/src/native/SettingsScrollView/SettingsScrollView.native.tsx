import React, { type ReactNode } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SettingsScrollViewProps = Readonly<{ children: ReactNode; testID?: string }>;

/** Scrolls a Settings screen; the end of the content stays clear of the home indicator. */
export function SettingsScrollView({ children, testID }: SettingsScrollViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: bottomInset }} testID={testID}>
      {children}
    </ScrollView>
  );
}

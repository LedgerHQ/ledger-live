import React from "react";
import { View } from "react-native";

export function Footer(props: React.ComponentProps<typeof View>) {
  return <View {...props} />;
}

export type FooterElement = React.ReactElement<
  React.ComponentPropsWithoutRef<typeof Footer>,
  typeof Footer
>;

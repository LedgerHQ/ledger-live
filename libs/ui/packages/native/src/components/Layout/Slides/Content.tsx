import React from "react";
import { View } from "react-native";
import { Slide } from "./Slide";

export function Content(props: React.ComponentProps<typeof View>) {
  return <View {...props} />;
}

Content.Item = Slide;

export type ContentElement = React.ReactElement<
  React.ComponentPropsWithoutRef<typeof Content>,
  typeof Content
>;

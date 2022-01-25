import { storiesOf as storiesOfNative } from "@storybook/react-native";
import { storiesOf as storiesOfWeb } from "@storybook/react";

export type StoryOf = typeof storiesOfNative | typeof storiesOfWeb;

export function storiesOf(storyFn: (story: StoryOf) => void): void {
  [storiesOfNative, storiesOfWeb].forEach(storyFn);
}

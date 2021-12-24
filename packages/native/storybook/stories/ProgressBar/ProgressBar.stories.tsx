import React from "react";
import { number } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { Flex, ProgressBar, Button, Icons, Text } from "../../../src";

const description = `
### An animated progress bar.

This is a simple implementation of an animated and styled progress bar.

## Usage

\`\`\`js

import { ProgressBar } from "@ledgerhq/native-ui"
\`\`\`

\`ProgressBar\` basically accepts two props, the maximum number of steps and the active step index.
<br/>
Whenever these are changed the bar will fill itself up.

*Note: extra props will get passed through to the bar container element which is an instance of \`Flex\`.*

\`\`\`js
// Max number of steps.
const MAX_STEPS = 5;
// Active index.
const [index, setIndex] = React.useState(0);

<Flex width={300}>
  <ProgressBar index={index} length={MAX_STEPS} />
</Flex>
\`\`\`
`;

const Default = (): JSX.Element => {
  const length = number("length", 5);
  const [_index, setIndex] = React.useState<number | null>(null);
  const index = _index ?? number("index", 1);

  const add = () => setIndex((_index) => Math.min((_index ?? index) + 1, length - 1));
  const remove = () => setIndex((_index) => Math.max((_index ?? index) - 1, 0));

  return (
    <>
      <Flex width={300}>
        <ProgressBar index={index} length={length} />
      </Flex>
      <Flex mt={8} borderWidth={1} p={8} alignItems="center" borderColor="neutral.c50" width={300}>
        <Text variant="h2" mb={2}>
          Controls
        </Text>
        <Text variant="tiny" mb={8} fontWeight="semiBold">
          Active index: {index} / {length - 1}
        </Text>
        <Flex flexDirection="row" justifyContent="space-around" width="100%">
          <Button Icon={Icons.MinusMedium} onPress={remove} mr={2} />
          <Button Icon={Icons.PlusMedium} onPress={add} />
        </Flex>
      </Flex>
    </>
  );
};

storiesOf((story) =>
  story("ProgressBar", module).add("Default", Default, {
    docs: {
      title: "Default",
      description: {
        component: description,
      },
    },
  }),
);

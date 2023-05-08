import React, { useState } from "react";
import { action } from "@storybook/addon-actions";
import { Flex, SelectableList } from "../../../src/components";
import { Icons } from "../../../src/assets";
import { TouchableOpacity } from "react-native";

const description = `
### A styled list of valued and selectable elements.

Each element of the list has an associated value (_of any similar type - not necessarily strings_)
and can be selected by pressing it.

## Usage

\`\`\`js

import { SelectableList } from "@ledgerhq/native-ui"
\`\`\`

A \`SelectableList\` contains one or multiple \`SelectableList.Element\` components as children.


\`\`\`js
const [selectedValue, setSelectedValue] = React.useState()

/* … */

<SelectableList currentValue={selectedValue} onChange={setSelectedValue}>
  <SelectableList.Element value={1}>One</SelectableList.Element>
  <SelectableList.Element value={2}>Two</SelectableList.Element>
  <SelectableList.Element value={3}>Three</SelectableList.Element>
</SelectableList>
\`\`\`
`;

export default {
  title: "Form/SelectableList",
  component: SelectableList,
  parameters: {
    docs: {
      title: "Selectable List",
      description: {
        component: description,
      },
    },
  },
};

export const Story = () => {
  const [selectedValue, setSelectedValue] = useState();

  return (
    <Flex alignSelf="stretch" p={4}>
      <SelectableList currentValue={selectedValue} onChange={setSelectedValue}>
        <SelectableList.Element value="en" Icon={Icons.BedMedium}>
          English
        </SelectableList.Element>
        <SelectableList.Element
          value="fr"
          Icon={Icons.NanoXMedium}
          renderRight={() => (
            <TouchableOpacity onPress={action("onMore")}>
              <Icons.OthersMedium size={24} />
            </TouchableOpacity>
          )}
        >
          French
        </SelectableList.Element>
        <SelectableList.Element value="ru" Icon={Icons.NanoXFoldedMedium} disabled={true}>
          Russian
        </SelectableList.Element>
        <SelectableList.Element value="cz" Icon={Icons.BlockchainMedium}>
          Chinese
        </SelectableList.Element>
        <SelectableList.Element value="sp">Spanish</SelectableList.Element>
      </SelectableList>
    </Flex>
  );
};
Story.storyName = "SelectableList";

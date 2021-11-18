import React, { useState } from "react";
import { storiesOf } from "../storiesOf";
import { Flex, SelectableList } from "../../../src";

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

const Story = () => {
  const [selectedValue, setSelectedValue] = useState();

  return (
    <Flex alignSelf="stretch" p={4}>
      <SelectableList currentValue={selectedValue} onChange={setSelectedValue}>
        <SelectableList.Element value="en">English</SelectableList.Element>
        <SelectableList.Element value="fr">French</SelectableList.Element>
        <SelectableList.Element value="ru">Russian</SelectableList.Element>
        <SelectableList.Element value="cz">Chinese</SelectableList.Element>
        <SelectableList.Element value="sp">Spanish</SelectableList.Element>
      </SelectableList>
    </Flex>
  );
};

storiesOf((story) =>
  story("Form/SelectableList", module).add("SelectableList", Story, {
    docs: {
      title: "Selectable List",
      description: {
        component: description,
      },
    },
  })
);

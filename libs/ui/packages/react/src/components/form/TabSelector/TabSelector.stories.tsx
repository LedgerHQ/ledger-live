import React, { useState } from "react";

import TabSelector from "./index";

export default {
  title: "Form/SelectionControls/TabSelector",
  component: TabSelector,
};

const Template = () => {
  const [currentOption, setCurrentOption] = useState("mobile");
  return (
    <TabSelector
      options={["mobile", "desktop"]}
      selectedOption={currentOption}
      handleSelectOption={setCurrentOption}
      labels={{
        ["mobile"]: "Mobile",
        ["desktop"]: "Desktop",
      }}
    />
  );
};

export const Default = Template.bind({});

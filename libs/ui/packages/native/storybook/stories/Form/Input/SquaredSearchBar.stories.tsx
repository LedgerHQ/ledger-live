import React from "react";
import SquaredSearchBar from "../../../../src/components/Form/Input/SquaredSearchBar";

export default {
  title: "Form/Input/SquaredSearchBar",
  component: SquaredSearchBar,
};

export const SquaredSearchBarStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return <SquaredSearchBar value={value} onChange={onChange} placeholder={"Placeholder"} />;
};
SquaredSearchBarStory.storyName = "SquaredSearchBar";

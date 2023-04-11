import React from "react";
import SearchInput from "../../../../src/components/Form/Input/SearchInput";

export default {
  title: "Form/Input/SearchInput",
  component: SearchInput,
};

export const SearchInputStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return <SearchInput value={value} onChange={onChange} placeholder={"Placeholder"} />;
};
SearchInputStory.storyName = "SearchInput";

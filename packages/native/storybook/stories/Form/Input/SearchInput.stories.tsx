import { storiesOf } from "../../storiesOf";
import React from "react";
import SearchInput from "../../../../src/components/Form/Input/SearchInput";

export const SearchInputStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value) => setValue(value);

  return (
    <SearchInput
      value={value}
      onChangeText={onChange}
      placeholder={"Placeholder"}
    />
  );
};

storiesOf((story) =>
  story("Form/Input", module).add("SearchInput", SearchInputStory)
);

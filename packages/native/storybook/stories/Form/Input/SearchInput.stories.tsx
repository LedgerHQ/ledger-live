import { storiesOf } from "../../storiesOf";
import React from "react";
import SearchInput from "../../../../src/components/Form/Input/SearchInput";

const SearchInputStory = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  const onChange = (value: string) => setValue(value);

  return <SearchInput value={value} onChange={onChange} placeholder={"Placeholder"} />;
};

storiesOf((story) => story("Form/Input", module).add("SearchInput", SearchInputStory));

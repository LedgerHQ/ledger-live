import React from "react";
import SelectInput, { Props } from "./index";
import { VirtualMenuList } from "./VirtualMenuList";

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "lemon", label: "Lemon" },
  { value: "vanilla", label: "Vanilla" },
];

// for (let i = 0; i < 1000; i++) {
//   options.push({ value: "" + i, label: "" + i });
// }

export default {
  title: "Form/Input/SelectInput",
  component: SelectInput,
};

export const Default = (args: Props): JSX.Element => {
  const [value, setValue] = React.useState(null);

  return (
    <SelectInput
      options={options}
      value={value}
      onChange={setValue}
      isOptionDisabled={(option) => option.value === "lemon"}
      // menuIsOpen
      // components={{
      //   MenuList: VirtualMenuList,
      // }}
      // renderRight={() => "RIGHT"}
      // renderLeft={() => "LEFT"}
      {...args}
    />
  );
};

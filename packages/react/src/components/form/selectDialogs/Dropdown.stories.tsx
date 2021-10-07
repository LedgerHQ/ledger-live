import React from "react";
import DropdownComponent, { Props as DropdownProps } from "./Dropdown";

export default {
  title: "Form/SelectAndDialogs/Dropdown",
  component: DropdownComponent,
  argTypes: {
    value: { table: { disable: true } },
    renderLeft: { table: { disable: true } },
    renderRight: { table: { disable: true } },
    rowHeight: { table: { disable: true } },
    isDisabled: { type: "boolean" },
    error: { type: "string" },
    menuIsOpen: { type: "boolean" },
    label: { type: "string", defaultValue: "Label" },
  },
};

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "lemon", label: "Lemon" },
  { value: "vanilla", label: "Vanilla" },
];

export const Dropdown = (args: DropdownProps): React.ReactNode => {
  const [value, setValue] = React.useState<typeof options[0] | null>(null);

  return <DropdownComponent options={options} value={value} onChange={setValue} {...args} />;
};

import React from "react";
import { components, StylesConfig } from "react-select";
import SplitInput, { Props } from "./index";
import Input from "../BaseInput";
import QuantityInput from "../QuantityInput";
import QrCodeInput from "../QrCodeInput";
import SelectInput, { Props as SelectInputProps } from "../SelectInput";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";

export default {
  title: "Form/Input/Split",
  component: SplitInput,
  argTypes: {
    value: { table: { disable: true } },
    renderLeft: { table: { disable: true } },
    renderRight: { table: { disable: true } },
    rowHeight: { table: { disable: true } },
    isDisabled: { table: { disable: true } },
    disabled: { type: "boolean" },
    error: { type: "string" },
  },
};

const options = [
  // Labels contain muttons spaces (U+2003 character).
  // Do not replace with a regular space please!
  { value: "chocolate", label: "🍫 Chocolate" },
  { value: "strawberry", label: "🍓 Strawberry" },
  { value: "lemon", label: "🍋 Lemon" },
  { value: "vanilla", label: "🍦 Vanilla" },
];

const Label = ({ left, right }: { left: string; right: string }) => (
  <FlexBox justifyContent="space-between" mt={8} px={6}>
    <Text fontWeight="semiBold" variant={"small"}>
      {`<${left} />`}
    </Text>
    <Text fontWeight="semiBold" variant={"small"}>
      {`<${right} />`}
    </Text>
  </FlexBox>
);

const selectStyles: StylesConfig<Option> = {
  container: (provided, state) => ({
    ...provided,
    height: "100%",
    cursor: state.isDisabled ? "not-allowed" : "text",
    pointerEvents: undefined,
  }),
  control: (_, state) => ({
    display: "flex",
    alignItems: "center",
    height: "100%",
    padding: "0 20px",
    pointerEvents: state.isDisabled ? "none" : undefined,
  }),
};

type Option = (typeof options)[0];
export const Split = (args: Props): React.ReactNode => {
  const [leftValue1, setLeftValue1] = React.useState<Option | null>(null);
  const [rightValue1, setRightValue1] = React.useState<string>("");
  const [leftValue2, setLeftValue2] = React.useState<Option | null>(null);
  const [rightValue2, setRightValue2] = React.useState<string>("");
  const [leftValue3, setLeftValue3] = React.useState<Option | null>(null);
  const [rightValue3, setRightValue3] = React.useState<string>("");
  const [leftValue4, setLeftValue4] = React.useState<string>("");
  const [rightValue4, setRightValue4] = React.useState<string>("");

  return (
    <FlexBox flexDirection="column" rowGap={3}>
      <Label left="SelectInput" right="Input" />
      <SplitInput
        {...args}
        renderLeft={(props: SelectInputProps<Option>) => (
          <SelectInput
            value={leftValue1}
            options={options}
            placeholder="Left"
            unwrapped
            onChange={setLeftValue1}
            components={{
              Control: components.Control,
            }}
            styles={selectStyles}
            {...props}
          />
        )}
        renderRight={props => (
          <Input
            value={rightValue1}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={setRightValue1}
            {...props}
          />
        )}
      />
      <Label left="SelectInput" right="QuantityInput" />
      <SplitInput
        {...args}
        renderLeft={(props: SelectInputProps<Option>) => (
          <SelectInput
            value={leftValue2}
            options={options}
            placeholder="Left"
            unwrapped
            onChange={setLeftValue2}
            components={{
              Control: components.Control,
            }}
            styles={selectStyles}
            {...props}
          />
        )}
        renderRight={props => (
          <QuantityInput
            value={rightValue2}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={setRightValue2}
            {...props}
          />
        )}
      />
      <Label left="SelectInput" right="QrCodeInput" />
      <SplitInput
        {...args}
        renderLeft={(props: SelectInputProps<Option>) => (
          <SelectInput
            value={leftValue3}
            options={options}
            placeholder="Left"
            unwrapped
            onChange={setLeftValue3}
            components={{
              Control: components.Control,
            }}
            styles={selectStyles}
            {...props}
          />
        )}
        renderRight={props => (
          <QrCodeInput
            value={rightValue3}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={setRightValue3}
            {...props}
          />
        )}
      />
      <Label left="Input" right="Input" />
      <SplitInput
        {...args}
        renderLeft={props => (
          <Input
            value={leftValue4}
            placeholder="Left"
            unwrapped
            onChange={setLeftValue4}
            {...props}
          />
        )}
        renderRight={props => (
          <Input
            value={rightValue4}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={setRightValue4}
            {...props}
          />
        )}
      />
    </FlexBox>
  );
};

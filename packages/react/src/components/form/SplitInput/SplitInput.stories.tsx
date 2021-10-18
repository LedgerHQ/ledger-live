import React from "react";
import { components, OptionTypeBase } from "react-select";
import SplitInput, { Props } from "./index";
import Input from "../BaseInput";
import QuantityInput from "../QuantityInput";
import QrCodeInput from "../QrCodeInput";
import SelectInput from "../SelectInput";
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
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "lemon", label: "Lemon" },
  { value: "vanilla", label: "Vanilla" },
];

const Label = ({ left, right }: { left: string; right: string }) => (
  <FlexBox justifyContent="space-between" mt={8} px={6}>
    <Text ff="Inter|SemiBold" fontSize={2}>
      {`<${left} />`}
    </Text>
    <Text ff="Inter|SemiBold" fontSize={2}>
      {`<${right} />`}
    </Text>
  </FlexBox>
);

const selectStyles: React.ComponentProps<typeof SelectInput>["styles"] = {
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

export const Split = (args: Props): React.ReactNode => {
  const [leftValue1, setLeftValue1] = React.useState<OptionTypeBase | null>(null);
  const [rightValue1, setRightValue1] = React.useState<string>("");
  const [leftValue2, setLeftValue2] = React.useState<OptionTypeBase | null>(null);
  const [rightValue2, setRightValue2] = React.useState<string>("");
  const [leftValue3, setLeftValue3] = React.useState<OptionTypeBase | null>(null);
  const [rightValue3, setRightValue3] = React.useState<string>("");
  const [leftValue4, setLeftValue4] = React.useState<string>("");
  const [rightValue4, setRightValue4] = React.useState<string>("");

  return (
    <FlexBox flexDirection="column" rowGap={3}>
      <Label left="SelectInput" right="Input" />
      <SplitInput
        {...args}
        renderLeft={(props) => (
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
        renderRight={(props) => (
          <Input
            value={rightValue1}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRightValue1(e.currentTarget.value)
            }
            {...props}
          />
        )}
      />
      <Label left="SelectInput" right="QuantityInput" />
      <SplitInput
        {...args}
        renderLeft={(props) => (
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
        renderRight={(props) => (
          <QuantityInput
            value={rightValue2}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRightValue2(e.currentTarget.value)
            }
            {...props}
          />
        )}
      />
      <Label left="SelectInput" right="QrCodeInput" />
      <SplitInput
        {...args}
        renderLeft={(props) => (
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
        renderRight={(props) => (
          <QrCodeInput
            value={rightValue3}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRightValue3(e.currentTarget.value)
            }
            {...props}
          />
        )}
      />
      <Label left="Input" right="Input" />
      <SplitInput
        {...args}
        renderLeft={(props) => (
          <Input
            value={leftValue4}
            placeholder="Left"
            unwrapped
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLeftValue4(e.currentTarget.value)
            }
            {...props}
          />
        )}
        renderRight={(props) => (
          <Input
            value={rightValue4}
            placeholder="Right"
            textAlign="right"
            unwrapped
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRightValue4(e.currentTarget.value)
            }
            {...props}
          />
        )}
      />
    </FlexBox>
  );
};

import React, { useState } from "react";
import Button from "../../../../src/components/cta/Button";
import Input, {
  InputRenderLeftContainer,
  InputRenderRightContainer,
  CommonProps,
} from "../../../../src/components/Form/Input/BaseInput";
import Flex from "../../../../src/components/Layout/Flex";
import Text from "../../../../src/components/Text";

export default {
  title: "Form/Input/BaseInput",
  component: Input,
};

export const BaseInputStory = (args: typeof BaseInputStoryArgs) => {
  const [value, setValue] = useState("");

  const onChange = (value: string) => setValue(value);

  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={"Placeholder"}
      disabled={args.disabled}
      error={args.error}
    />
  );
};
BaseInputStory.storyName = "BaseInput";
const BaseInputStoryArgs = {
  disabled: false,
  error: "",
};
BaseInputStory.args = BaseInputStoryArgs;

export const BaseInputRenderSideExempleStory = () => {
  const [value, setValue] = useState("test@ledger.fr");
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const onChange = (value: string) => setValue(value);

  const renderLeft = (
    <InputRenderLeftContainer>
      <Button onPress={() => setDisabled(!disabled)}>disable</Button>
    </InputRenderLeftContainer>
  );
  const renderRight = (props: CommonProps) => {
    return (
      <InputRenderRightContainer>
        <Button onPress={() => setError(error ? "" : "Error message")} disabled={props.disabled}>
          error
        </Button>
      </InputRenderRightContainer>
    );
  };

  return (
    <Input
      value={value}
      onChange={onChange}
      renderLeft={renderLeft}
      renderRight={renderRight}
      placeholder={"test"}
      disabled={disabled}
      error={error}
    />
  );
};
BaseInputRenderSideExempleStory.storyName = "BaseInput (render side)";

function serialize(value: string) {
  return value.split("").join(".");
}

function deserialize(value: string) {
  return value.replace(/\./g, "");
}

export const CustomSerializer = (): JSX.Element => {
  const [value, setValue] = React.useState("");

  return (
    <>
      <Input
        value={value}
        onChange={setValue}
        serialize={serialize}
        deserialize={deserialize}
        placeholder={"Placeholder"}
      />
      <Flex flexDirection="row" alignItems="baseline" m={8} alignSelf="flex-start">
        <Text variant="large">Value: </Text>
        <Text>{value}</Text>
      </Flex>
    </>
  );
};
CustomSerializer.storyName = "BaseInput (custom serializer)";

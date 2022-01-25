import { storiesOf } from "../../storiesOf";
import { boolean, text } from "@storybook/addon-knobs";
import React, { useState } from "react";
import Button from "../../../../src/components/cta/Button";
import Input, {
  InputRenderLeftContainer,
  InputRenderRightContainer,
  CommonProps,
} from "../../../../src/components/Form/Input/BaseInput";
import Flex from "../../../../src/components/Layout/Flex";
import Text from "../../../../src/components/Text";

const BaseInputStory = () => {
  const [value, setValue] = useState("");

  const onChange = (value: string) => setValue(value);

  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={"Placeholder"}
      disabled={boolean("disabled", false)}
      error={text("error", "")}
    />
  );
};

const BaseInputRenderSideExempleStory = () => {
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

function serialize(value: string) {
  return value.split("").join(".");
}

function deserialize(value: string) {
  return value.replace(/\./g, "");
}

const CustomSerializer = (): JSX.Element => {
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

storiesOf((story) =>
  story("Form/Input/BaseInput", module)
    .add("BaseInput", BaseInputStory)
    .add("RenderSideExemple", BaseInputRenderSideExempleStory)
    .add("Custom Serializer", CustomSerializer),
);

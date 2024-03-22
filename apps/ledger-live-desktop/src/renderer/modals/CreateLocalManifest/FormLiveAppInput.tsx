import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import Input from "~/renderer/components/Input";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";

type Props = {
  type: string;
  fieldName: string;
  value: unknown;
  optional: boolean;
  parseCheck: boolean;
  path: string;
  isArray?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  handleChange: (path: string, value: unknown) => void;
};

function FormLiveAppInput({
  type,
  fieldName,
  value,
  optional,
  parseCheck,
  path,
  handleChange,
  isArray = false,
  autoFocus = false,
  disabled = false,
}: Props) {
  return (
    <Flex flexDirection={"column"}>
      <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
        {`${fieldName} (${type}) `}
        {!optional && <span style={{ color: "red" }}>*</span>}
      </Text>
      {typeof value === "boolean" ? (
        <Flex width={"max-content"} marginLeft={1}>
          <Switch
            isChecked={value}
            onChange={value => {
              handleChange(path, value);
            }}
          />
        </Flex>
      ) : (
        <Input
          error={!parseCheck}
          placeholder={optional ? "optional" : "required"}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(value: number | string) => {
            if (type === "number") {
              !isNaN(Number(value)) && handleChange(path, Number(value));
              return;
            }
            typeof value !== "number" &&
              handleChange(path, isArray ? (value ? value.split(",") : []) : value);
          }}
          value={String(value)}
        />
      )}
    </Flex>
  );
}

export default FormLiveAppInput;

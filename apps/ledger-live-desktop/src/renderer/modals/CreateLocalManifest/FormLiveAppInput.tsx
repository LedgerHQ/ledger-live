import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import Input from "~/renderer/components/Input";
import Switch from "~/renderer/components/Switch";
import FormLiveAppHeader from "./FormLiveAppHeader";
import { DESCRIPTIONS } from "./defaultValues";

type Props = {
  type: string;
  fieldName: string;
  value: unknown;
  optional: boolean;
  parseCheck: boolean;
  path: string;
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
  autoFocus = false,
  disabled = false,
}: Props) {
  return (
    <Flex flexDirection={"column"}>
      <FormLiveAppHeader
        fieldName={fieldName}
        description={DESCRIPTIONS[fieldName]}
        optional={optional}
      />
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
            typeof value !== "number" && handleChange(path, value);
          }}
          value={String(value)}
        />
      )}
    </Flex>
  );
}

export default FormLiveAppInput;

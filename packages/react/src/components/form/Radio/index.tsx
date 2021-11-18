import React, { InputHTMLAttributes } from "react";

import RadioElement from "./RadioElement";
import RadioListElement from "./RadioListElement";
import Flex from "../../layout/Flex";
import { FlexBoxProps } from "../../layout/Flex";

export type RadioProps = {
  currentValue?: InputHTMLAttributes<HTMLInputElement>["value"];
  onChange: (value: InputHTMLAttributes<HTMLInputElement>["value"]) => void;
  children: React.ReactNode;
  name: string;
  containerProps?: FlexBoxProps;
};

export const RadioContext = React.createContext<Omit<RadioProps, "children" | "containerProps">>({
  name: "",
  onChange: () => {},
});

const Radio = ({
  currentValue,
  name,
  onChange,
  children,
  containerProps,
}: RadioProps): JSX.Element => {
  return (
    <Flex columnGap="1.5rem" {...containerProps}>
      <RadioContext.Provider value={{ currentValue, name, onChange }}>
        {children}
      </RadioContext.Provider>
    </Flex>
  );
};

Radio.Element = RadioElement;
Radio.ListElement = RadioListElement;

export default Radio;

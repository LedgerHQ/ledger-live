import React from "react";
import { useTheme } from "styled-components";
import Input, { InputProps, InputRenderLeftContainer } from "../BaseInput";
import SearchMedium from "../../../assets/icons/SearchMedium";

export default function SearchInput(props: InputProps): JSX.Element {
  const theme = useTheme();

  return (
    <Input
      {...props}
      renderLeft={
        <InputRenderLeftContainer>
          <SearchMedium
            color={
              props.disabled ? theme.colors.palette.neutral.c50 : theme.colors.palette.neutral.c70
            }
          />
        </InputRenderLeftContainer>
      }
    />
  );
}

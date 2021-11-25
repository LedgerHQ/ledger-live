import React from "react";
import { useTheme } from "styled-components";
import Input, { InputProps, InputRenderLeftContainer } from "../BaseInput";
import SearchMedium from "@ledgerhq/icons-ui/react/SearchMedium";

export default function SearchInput(props: InputProps): JSX.Element {
  const theme = useTheme();

  return (
    <Input
      {...props}
      renderLeft={
        <InputRenderLeftContainer>
          <SearchMedium
            color={props.disabled ? theme.colors.neutral.c50 : theme.colors.neutral.c70}
          />
        </InputRenderLeftContainer>
      }
    />
  );
}

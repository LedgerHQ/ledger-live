import React from "react";
import { useTheme } from "styled-components";
import Input, { InputProps, InputRenderLeftContainer } from "../BaseInput";
import SearchMedium from "@ledgerhq/icons-ui/react/SearchMedium";

function SearchInput(props: InputProps, ref?: React.ForwardedRef<HTMLInputElement>): JSX.Element {
  const theme = useTheme();

  return (
    <Input
      ref={ref}
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

export default React.forwardRef(SearchInput);

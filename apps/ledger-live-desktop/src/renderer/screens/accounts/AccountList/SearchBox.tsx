import React, { useState, forwardRef } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import SearchIcon from "~/renderer/icons/Search";

type Props = {
  onTextChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
  search?: string;
  placeholder?: string;
  autoFocus?: boolean;
  id?: string;
};
const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  flex-grow: 1;
  font-family: "Inter";
  font-weight: 500;
  font-size: 13px;
  cursor: text;
  color: ${p => p.theme.colors.palette.text.shade100};
  &::placeholder {
    color: #999999;
    font-weight: 500;
  }
`;
const SearchIconContainer = styled(Box).attrs<{
  focused?: boolean;
}>(p => ({
  style: {
    color: p.focused ? p.theme.colors.palette.text.shade100 : p.theme.colors.palette.text.shade40,
  },
}))<{
  focused?: boolean;
}>`
  justify-content: center;
`;

const SearchBox = forwardRef<HTMLInputElement, Props>(function Search(
  { onTextChange, search, placeholder, autoFocus, ...p }: Props,
  ref,
) {
  const [focused, setFocused] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <SearchIconContainer pr={3} focused={focused || !!search}>
        <SearchIcon size={16} />
      </SearchIconContainer>
      <SearchInput
        {...p}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder || t("common.search")}
        onChange={onTextChange}
        value={search}
        ref={ref}
      />
    </>
  );
});
export default React.memo(SearchBox) as typeof SearchBox; // to preserve the ref forwarding prop

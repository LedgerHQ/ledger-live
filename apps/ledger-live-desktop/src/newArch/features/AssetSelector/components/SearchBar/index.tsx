import React from "react";
import { Search } from "@ledgerhq/ldls-ui-react";
import styled from "styled-components";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

const StyledSearch = styled(Search)`
  margin: 2px;
`;

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <StyledSearch
      placeholder="Search"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  );
};

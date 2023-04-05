import React, { useState, useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import styled from "styled-components";
import { FILTER } from "../utils";
import Button from "~/renderer/components/Button";
import { Icons } from "@ledgerhq/react-ui";
type Props = {
  onClick: () => void;
};
const Container: ThemedComponent<{}> = styled(Box).attrs(() => ({}))`
  flex-direction: row;
  margin: 10px 0;
`;
export const Btn: ThemedComponent<{}> = styled(Button).attrs(p => {
  return {
    key: p.key,
    primary: p.selected,
    outline: p.selected,
    onClick: () => p.updateFilter(p.type),
    iconPosition: "left",
  };
})`
  border-radius: 500px;
  margin-right: 12px;
  padding: 0 12px;
  height: 32px;
  color: ${p => (p.selected ? p.theme.colors.neutral.c00 : p.theme.colors.neutral.c100)};
  background-color: ${p => (p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c30)};
  &:active,
  &:hover {
    color: ${p => (p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c100)};
  }
`;
export default function Filter({ onClick }: Props) {
  const [filter, setFilter] = useState([]);
  const updateFilter = useCallback(
    type => {
      let newFilter = [];
      if (filter.includes(type)) {
        newFilter = filter.filter(e => e !== type);
      } else {
        switch (type) {
          case FILTER.centralised:
            newFilter = [type, ...filter.filter(f => f !== FILTER.decentralised)];
            break;
          case FILTER.decentralised:
            newFilter = [type, ...filter.filter(f => f !== FILTER.centralised)];
            break;
          case FILTER.fixed:
            newFilter = [type, ...filter.filter(f => f !== FILTER.float)];
            break;
          case FILTER.float:
            newFilter = [type, ...filter.filter(f => f !== FILTER.fixed)];
            break;
          default:
        }
      }
      setFilter(newFilter);
      onClick(newFilter);
    },
    [filter, onClick],
  );
  return (
    <Container>
      {[FILTER.centralised, FILTER.decentralised, FILTER.float, FILTER.fixed].map(type => {
        const selected = filter.includes(type);
        const props = {
          selected,
          key: type,
          updateFilter,
          type,
        };
        return (
          <Btn key={type} {...props} data-test-id={`${type}-quote-filter-button`}>
            {selected ? (
              <Box mr={1}>
                <Icons.CloseMedium size={16} />
              </Box>
            ) : null}
            {<Trans i18nKey={`swap.providers.filter.${type}`} />}
          </Btn>
        );
      })}
    </Container>
  );
}

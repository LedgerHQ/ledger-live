// @flow
import React, { useState, useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import styled from "styled-components";
import { FILTER } from "../utils";
import Button from "~/renderer/components/Button";
import { Icons } from "@ledgerhq/react-ui";

type Props = {
  onClick: () => void,
};

const Container: ThemedComponent<{}> = styled(Box).attrs(() => ({}))`
  flex-direction: row;
  margin: 10px 0;
`;

export const Btn: ThemedComponent<{}> = styled(Button).attrs((p) => {
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
  color: ${(p) => (p.selected ? p.theme.colors.neutral.c00 : p.theme.colors.neutral.c100)};
  background-color: ${(p) =>
    p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c30};
  &:active,
  &:hover {
    color: ${(p) => (p.selected ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c100)};
  }
`;

export default function ProviderRate({ onClick }: Props) {
  const [filter, setFilter] = useState([]);

  const updateFilter = useCallback(
    (type) => {
      let newFilter = [];
      if (filter.includes(type)) {
        newFilter = filter.filter((e) => e !== type);
        setFilter(newFilter);
      } else {
        setFilter([type, ...filter]);
        newFilter = [type, ...filter];
      }
      // If centralised & decentralised filters are active, these 2 filters will not be applied
      if ([FILTER.centralised, FILTER.decentralised].every((elem) => newFilter.includes(elem))) {
        newFilter = newFilter.filter(
          (f) => ![FILTER.centralised, FILTER.decentralised].includes(f),
        );
      }
      // If fixed & float filters are active, these 2 filters will not be applied
      if ([FILTER.fixed, FILTER.float].every((elem) => newFilter.includes(elem))) {
        newFilter = newFilter.filter((f) => ![FILTER.fixed, FILTER.float].includes(f));
      }
      onClick(newFilter);
    },
    [filter, onClick],
  );

  return (
    <Container>
      {[FILTER.centralised, FILTER.decentralised, FILTER.float, FILTER.fixed].map((type, i) => {
        const selected = filter.includes(type);
        const props = { selected, key: type, updateFilter, type };
        return (
          <Btn key={type} {...props}>
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

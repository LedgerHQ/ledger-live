import React from "react";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import Box, { Tabbable } from "~/renderer/components/Box";

export type Item<V> = {
  label: string;
  key: string;
  value?: V;
};

type Props<V, I extends Item<V>> = {
  items: Array<I>;
  activeKey: string;
  onChange: (a: I) => void;
  bordered?: boolean;
};

const Container = styled(Box).attrs(() => ({
  horizontal: true,
}))<{
  bordered?: boolean;
  isActive?: boolean;
}>``;

type PillProps = {
  isActive: boolean;
  bordered?: boolean;
};

const Pill = styled(Tabbable).attrs<PillProps>(p => ({
  ff: p.bordered ? "Inter|Bold" : "Inter|SemiBold",
  color: p.isActive ? "wallet" : "palette.text.shade60",
  bg: p.isActive ? rgba(p.theme.colors.wallet, 0.1) : "",
  px: p.bordered ? 2 : 3,
  fontSize: 3,
  borderRadius: 1,
  alignItems: "center",
  justifyContent: "center",
}))<PillProps>`
  border: ${p => (p.bordered ? "1px solid" : "none")};
  border-color: ${p => (p.isActive ? p.theme.colors.wallet : p.theme.colors.palette.divider)};
  height: 28px;
  outline: none;
  cursor: ${p => (p.isActive ? "default" : "pointer")};
  min-width: ${p => (p.bordered ? "40px" : "")};

  &:hover {
    color: ${p => (p.isActive ? p.theme.colors.wallet : p.theme.colors.palette.text.shade100)};
  }

  &:focus {
    color: ${p => p.theme.colors.wallet};
    background-color: ${p => (p.isActive ? "" : rgba(p.theme.colors.palette.text.shade100, 0.02))};
  }
`;
function Pills<V, I extends Item<V>>(props: Props<V, I>) {
  const { items, activeKey, onChange, bordered, ...p } = props;
  return (
    <Container {...p} flow={1}>
      {items.map(item => {
        const isActive = item.key === activeKey;
        return (
          <Pill
            isActive={isActive}
            onClick={() => onChange(item)}
            key={item.key}
            bordered={bordered}
            data-test-id={`settings-${item.key}-tab`}
          >
            {item.label}
          </Pill>
        );
      })}
    </Container>
  );
}
export default Pills;

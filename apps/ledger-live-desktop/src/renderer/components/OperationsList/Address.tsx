import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const splitAddress = (value: string): { left: string; right: string } => {
  let left, right;
  if (value.includes(".")) {
    const parts = value.split(".");
    left = parts[0] + ".";
    right = parts.slice(1).join(".");
  } else {
    const third = Math.round(value.length / 3);
    left = value.slice(0, third);
    right = value.slice(third, value.length);
  }
  return { left, right };
};

export const SplitAddress = ({
  value,
  color,
  ff,
  fontSize,
}: {
  value: string;
  color?: string;
  ff?: string;
  fontSize?: number;
}) => {
  if (!value) {
    return <Box />;
  }
  const boxProps = {
    color,
    ff,
    fontSize,
  };

  const { left, right } = splitAddress(value);

  return (
    <Box horizontal {...boxProps}>
      <Left>{left}</Left>
      <Right>{right}</Right>
    </Box>
  );
};

export const Address = ({ value }: { value: string }) => (
  <SplitAddress value={value} color="neutral.c80" ff="Inter" fontSize={3} />
);

const Left = styled.div`
  overflow: hidden;
  max-width: calc(100% - 20px);
  white-space: nowrap;
  font-kerning: none;
  letter-spacing: 0px;
`;

const Right = styled.div`
  display: inline-block;
  flex-shrink: 1;
  direction: rtl;
  text-indent: 0.6ex;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-kerning: none;
  min-width: 3ex;
  letter-spacing: 0px;
`;

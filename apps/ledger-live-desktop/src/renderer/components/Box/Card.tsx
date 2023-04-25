import React from "react";
import styled from "styled-components";
import Text from "~/renderer/components/Text";
import Box, { BoxProps } from "./Box";

export type RawCardProps = BoxProps & {
  bg?: string;
  color?: string;
};

export const RawCard = styled(Box).attrs<RawCardProps>(p => ({
  bg: p.bg || "palette.background.paper",
  boxShadow: 0,
  borderRadius: 1,
  color: p.color || "inherit",
}))``;

export type CardProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
} & React.ComponentProps<typeof RawCard>;

const Card = ({ title, ...props }: CardProps) => {
  if (title) {
    return (
      <Box flow={4} grow>
        <Text color="palette.text.shade100" ff="Inter" fontSize={6}>
          {title}
        </Text>
        <RawCard {...props} grow />
      </Box>
    );
  }
  return <RawCard {...props} />;
};
export default Card;

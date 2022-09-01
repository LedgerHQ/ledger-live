import React from "react";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import FormatDay from "./FormatDay";

type Props = {
  section: {
    day: Date;
  };
  withoutMarginBottom?: boolean;
};

const Container = styled(Flex).attrs(
  (p: { withoutMarginBottom?: boolean }) => ({
    backgroundColor: "neutral.c30",
    padding: 5,
    borderRadius: 2,
    marginTop: 7,
    marginBottom: !p.withoutMarginBottom && 3,
  }),
)<{ withoutMarginBottom?: boolean }>``;

export default function SectionHeader({
  section,
  withoutMarginBottom = false,
}: Props) {
  return (
    <Container withoutMarginBottom={withoutMarginBottom}>
      <Text
        numberOfLines={1}
        color="neutral.c80"
        fontWeight="semiBold"
        variant="subtitle"
        uppercase
      >
        <FormatDay day={section.day} />
      </Text>
    </Container>
  );
}

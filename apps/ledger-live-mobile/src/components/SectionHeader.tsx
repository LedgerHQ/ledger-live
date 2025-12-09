import React from "react";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import isEqual from "lodash/isEqual";
import FormatDay from "./DateFormat/FormatDay";

type Props = {
  day: Date;
  withoutMarginBottom?: boolean;
};

type ContainerProps = {
  withoutMarginBottom?: boolean;
}

const Container = styled(Flex).attrs<ContainerProps>((p) => ({
  backgroundColor: "neutral.c30",
  padding: 5,
  borderRadius: 2,
  marginTop: 7,
  marginBottom: !p.withoutMarginBottom ? 3 : 0,
}))<ContainerProps>``;

function SectionHeader({ day, withoutMarginBottom = false }: Props) {
  return (
    <Container withoutMarginBottom={withoutMarginBottom}>
      <Text
        numberOfLines={1}
        color="neutral.c80"
        fontWeight="semiBold"
        variant="subtitle"
        uppercase
      >
        <FormatDay day={day} />
      </Text>
    </Container>
  );
}

/** isEqual on dates is fine, I promise */
export default React.memo(SectionHeader, isEqual);

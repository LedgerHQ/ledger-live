import { Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import { HeaderWrapper } from "../TableContainer";
import useDateFormatter from "~/renderer/hooks/useDateFormatter";

type Props = {
  date: Date;
};

const SectionTitle = ({ date }: Props) => {
  const theme = useTheme();
  const { f } = useDateFormatter({ calendar: true });

  return (
    <HeaderWrapper>
      <Text fontWeight="semiBold" fontSize={3} color={theme.colors.palette.text.shade50}>
        {f(date)}
      </Text>
    </HeaderWrapper>
  );
};

export default SectionTitle;

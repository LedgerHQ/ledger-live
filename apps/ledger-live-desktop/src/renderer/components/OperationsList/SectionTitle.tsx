import { Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import { HeaderWrapper } from "../TableContainer";
import { useCalendarFormatted } from "~/renderer/hooks/useDateFormatter";

type Props = {
  date: Date;
  className?: string;
};

const SectionTitle = ({ date, className }: Props) => {
  const theme = useTheme();
  const txt = useCalendarFormatted(date);

  return (
    <HeaderWrapper className={className}>
      <Text fontWeight="semiBold" fontSize={3} color={theme.colors.palette.text.shade50}>
        {txt}
      </Text>
    </HeaderWrapper>
  );
};

export default SectionTitle;

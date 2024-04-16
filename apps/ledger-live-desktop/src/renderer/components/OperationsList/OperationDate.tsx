import React from "react";
import styled from "styled-components";
import Text from "~/renderer/components/Text";
import { useDateFormatted, hourFormat } from "~/renderer/hooks/useDateFormatter";

const Hour = styled(Text).attrs(() => ({
  color: "palette.text.shade60",
  fontSize: 3,
  ff: "Inter",
}))`
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

export default function OperationDate({ date }: { date: Date }) {
  const txt = useDateFormatted(date, hourFormat);
  return <Hour>{txt}</Hour>;
}

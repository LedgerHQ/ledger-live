import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useTheme } from "styled-components";

const Field = styled(Text)`
  flex: 1;
`;

interface TrackingInfoListProps {
  title: string;
  items: string[];
  variant: "success" | "error";
}

const TrackingInfoList = ({ title, items, variant }: TrackingInfoListProps) => {
  const { colors } = useTheme();
  const Icon = variant === "success" ? Icons.Check : Icons.Close;
  const color = variant === "success" ? colors.success.c70 : colors.error.c50;
  const textColor = variant === "success" ? colors.neutral.c100 : colors.neutral.c70;

  return (
    <Flex flexDirection={"column"} alignItems={"start"} rowGap={"16px"}>
      <Text variant="body" fontWeight="medium" fontSize={14} color={colors.neutral.c100}>
        {title}
      </Text>
      {items.map((text, index) => (
        <Flex key={index} columnGap={"8px"} alignItems={"center"}>
          <Icon size={"S"} color={color} />
          <Field variant="paragraph" fontWeight="medium" fontSize={13} color={textColor}>
            {text}
          </Field>
        </Flex>
      ))}
    </Flex>
  );
};

export default TrackingInfoList;

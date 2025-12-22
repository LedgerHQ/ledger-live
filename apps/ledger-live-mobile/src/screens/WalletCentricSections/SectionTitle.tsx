import React, { memo } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";

type Props = {
  title: React.ReactNode;
  containerProps?: FlexBoxProps;
  testID?: string;
};

const SectionTitle = ({ title, containerProps, testID }: Props) => {
  return (
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      {...containerProps}
      testID={testID}
    >
      <Text variant="small" fontWeight="semiBold" color="neutral.c70" uppercase flexShrink={1}>
        {title}
      </Text>
    </Flex>
  );
};

export default memo<Props>(SectionTitle);

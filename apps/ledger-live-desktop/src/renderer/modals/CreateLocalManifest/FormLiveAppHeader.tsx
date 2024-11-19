import { Flex } from "@ledgerhq/react-ui";
import React from "react";
import Text from "~/renderer/components/Text";

type Props = { fieldName: string; description?: string; optional: boolean };

const FormLiveAppHeader = ({ fieldName, description, optional }: Props) => {
  return (
    <Flex marginBottom={1} flexDirection={"column"}>
      <Text marginLeft={1} ff="Inter|Medium" fontSize={4}>
        {`${fieldName} `}
        {!optional && <span style={{ color: "red" }}>*</span>}
      </Text>
      {description && (
        <Text color={"grey"} marginLeft={1} ff="Inter|Medium" fontSize={2}>
          {description}
        </Text>
      )}
    </Flex>
  );
};

export default FormLiveAppHeader;

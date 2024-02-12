import React from "react";

import { Flex, Text } from "@ledgerhq/native-ui";

type Props = {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  uppercase?: boolean;
  description?: React.ReactNode;
  footer: React.ReactNode;
  shouldWrapDesc?: boolean;
};

const ModalBottomAction = ({
  icon,
  title,
  uppercase,
  description,
  footer,
  shouldWrapDesc = true,
}: Props) => {
  return (
    <Flex alignItems="center">
      {icon && <Flex mb={24}>{icon}</Flex>}
      {title ? (
        <Text mb={6} uppercase={uppercase !== false} fontWeight="semiBold" variant="h3">
          {title}
        </Text>
      ) : null}
      <Flex flexDirection="column" mx={6} width="100%">
        {description && shouldWrapDesc ? (
          <Text variant="body" mb={24} color="neutral.c80">
            {description}
          </Text>
        ) : (
          description
        )}
        {footer}
      </Flex>
    </Flex>
  );
};

export default ModalBottomAction;

import React, { Component } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";

export default class ModalBottomAction extends Component<{
  icon?: any;
  title?: any;
  uppercase?: boolean;
  description?: any;
  footer: any;
  shouldWrapDesc?: boolean;
}> {
  render() {
    const {
      icon,
      title,
      uppercase,
      description,
      footer,
      shouldWrapDesc = true,
    } = this.props;
    return (
      <Flex alignItems="center">
        {icon && <Flex mb={24}>{icon}</Flex>}
        {title ? (
          <Text
            mb={6}
            uppercase={uppercase !== false}
            fontWeight="semiBold"
            variant="h3"
          >
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
  }
}

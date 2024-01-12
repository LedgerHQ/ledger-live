import React from "react";
import { Box, BoxedIcon, Flex, Text } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import styled from "styled-components";

export const ErrorTitle = styled(Text)`
  color: ${p => p.theme.colors.neutral.c100};
  text-align: center;
  max-width: 400px;
  user-select: text;
`;

export const ErrorDescription = styled(Text)`
  color: ${p => p.theme.colors.neutral.c80};
  white-space: pre-wrap;
  text-align: center;
  max-width: 400px;
  user-select: text;
`;

/** Renders an error icon, title and description */
export const ErrorBody: React.FC<{
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  list?: string | React.ReactNode;
  /**
   * react node to render instead of the icon, at the top
   * */
  top?: React.ReactNode | null | undefined;
  /**
   * icon to render inside a box
   */
  Icon?: React.ComponentType<{ color?: string | undefined; size?: number | undefined }> | undefined;
  iconColor?: string;
  buttons?: React.ReactNode;
}> = withV3StyleProvider(({ top, Icon, iconColor, title, description, list, buttons }) => {
  return (
    <>
      <Box alignSelf="center">
        {top ? (
          top
        ) : Icon ? (
          <BoxedIcon Icon={Icon} size={64} iconSize={24} iconColor={iconColor || "neutral.c100"} />
        ) : null}
      </Box>
      <ErrorTitle variant="h5Inter" fontWeight="semiBold" mt={top || Icon ? 10 : 0}>
        {title}
      </ErrorTitle>
      {description ? (
        <ErrorDescription variant="body" fontWeight="medium" mt={6}>
          {description}
        </ErrorDescription>
      ) : null}
      {list ? <ErrorDescription>{list}</ErrorDescription> : null}
      {buttons ? (
        <Flex alignSelf="center" mt={10} flexDirection="row" columnGap={6}>
          {buttons}
        </Flex>
      ) : null}
    </>
  );
});

import React from "react";
import { BoxedIcon, Text } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import styled from "styled-components";

export const ErrorTitle = styled(Text).attrs({
  color: "neutral.c100",
  textAlign: "center",
})``;

export const ErrorDescription = styled(Text).attrs({
  color: "neutral.c80",
  whiteSpace: "pre-wrap",
  textAlign: "center",
})``;

/** Renders an error icon, title and description */
export const ErrorBody: React.FC<{
  /**
   * react node to render instead of the icon, at the top
   * */
  top?: React.ReactNode | null | undefined;
  /**
   * icon to render inside a box
   */
  Icon?:
    | ((props: { color?: string | undefined; size?: number | undefined }) => JSX.Element)
    | undefined;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  list?: string | React.ReactNode;
}> = withV3StyleProvider(({ top, Icon, title, description, list }) => {
  return (
    <>
      {top ? (
        top
      ) : Icon ? (
        <BoxedIcon Icon={Icon} size={64} iconSize={24} iconColor="neutral.c100" />
      ) : null}
      <ErrorTitle variant="h5Inter" fontWeight="semiBold" mt={top || Icon ? 10 : 0}>
        {title}
      </ErrorTitle>
      <ErrorDescription variant="body" fontWeight="medium" mt={6}>
        {description}
      </ErrorDescription>
      {list ? <ErrorDescription>{list}</ErrorDescription> : null}
    </>
  );
});

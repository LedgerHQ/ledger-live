/**
 *                                   Image
 *                                   -----
 *  Usage:
 *
 *    <Image
 *      resource=Asset || { dark: Asset1, light: Asset2 }   // The asset
 *      themeTyped        // Should I load a contrasted version based on theme type ? (light/dark)
 *      ...Props          // The remaining props will be forwarded to the img
 *    />
 *
 */

import React from "react";
import styled from "styled-components";
import useTheme from "~/renderer/hooks/useTheme";

type Resource = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dark: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  light: any;
};
type Props = {
  resource: Resource | string;
  alt: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Img>, "resource" | "src">;
const Img = styled.img`
  user-select: none;
  pointer-events: none;
`;
const Image = ({ resource, alt, className, ...rest }: Props) => {
  const type = useTheme().theme;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const asset = typeof resource === "object" ? resource[type as keyof Resource] : resource;
  return <Img {...rest} alt={alt} className={className} src={asset} />;
};
export default Image;

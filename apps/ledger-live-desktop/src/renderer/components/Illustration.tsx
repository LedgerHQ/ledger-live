import { ThemedComponent } from "renderer/styles/StyleProviderV3";
import styled, { DefaultTheme, ThemeProps } from "styled-components";
import { Box } from "@ledgerhq/react-ui";

type Props = {
  lightSource: string;
  darkSource: string;
  size: number;
};

const defineStyleFromTheme = (lightAsset: string, darkAsset: string) => (
  p: ThemeProps<DefaultTheme>,
) => (p.theme.colors.palette.type === "light" ? lightAsset : darkAsset);

const Img: ThemedComponent<Props> = styled(Box).attrs((p: Props) => ({
  width: `${p.size}px`,
  height: `${p.size}px`,
}))<Props>`
  background: url(${(p: Props) => defineStyleFromTheme(p.lightSource, p.darkSource)(p)});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
`;

export default Img;

import styled from "styled-components";
import { fontSize, color, alignItems } from "styled-system";
import fontFamily from "~/renderer/styles/styled/fontFamily";
export default styled.label.attrs<{
  fontSize?: number;
  ff?: string;
}>(p => ({
  fontSize: p.fontSize || 4,
  ff: p.ff || "Inter|Medium",
  color: p.color || "palette.text.shade60",
  alignItems: "center",
  display: "block",
}))<{
  fontSize?: number;
  ff?: string;
  mt?: string | number;
  mb?: string | number;
  ml?: string | number;
  mr?: string | number;
}>`
  margin-top: ${p => (p.mt ? `${p.mt}px` : "auto")};
  margin-bottom: ${p => (p.mb ? `${p.mb}px` : "auto")};
  margin-left: ${p => (p.ml ? `${p.ml}px` : "0px")};
  margin-right: ${p => (p.mr ? `${p.mr}px` : "0px")};
  ${alignItems};
  ${color};
  ${fontSize};
  ${fontFamily};
  display: flex;
`;

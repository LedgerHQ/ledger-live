import styled from "styled-components";
import get from "lodash/get";
import Box from "~/renderer/components/Box";

/**
 * @deprecated prefer to use your own styled component. the "color" get pattern is really not good for typing.
 */
const Bar = styled(Box)<{
  color?: string;
  size?: number;
}>`
  background: ${p => get(p.theme.colors, String(p.color))};
  height: ${p => p.size || 1}px;
  width: 100%;
`;

export default Bar;

import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui";

export const Badge = styled(Text)`
  border-radius: 30px;
  background-color: ${p => p.theme.colors.opacityDefault.c10};
  color: ${p => p.theme.colors.neutral.c100};
  display: flex;
  align-items: center;
  padding: 0px 8px;
`;

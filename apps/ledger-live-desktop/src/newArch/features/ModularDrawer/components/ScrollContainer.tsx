import { Flex } from "@ledgerhq/react-ui/index";
import styled from "styled-components";

export const ScrollContainer: typeof Flex = styled(Flex)`
  flex: 1;
  flex-direction: column;
  overflow: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(to bottom, black calc(100% - 20px), transparent 100%);
`;

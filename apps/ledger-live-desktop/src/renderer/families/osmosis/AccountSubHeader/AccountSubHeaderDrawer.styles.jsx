// @flow

import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

export const Title: ThemedComponent<{}> = styled(Text)`
  font-style: normal;
  font-weight: 600;
  font-size: 22px;
  line-height: 27px;
`;

export const Divider: ThemedComponent<{}> = styled(Box)`
  border: 1px solid #f5f5f5;
`;

export const Description: ThemedComponent<{}> = styled(Text)`
  font-size: 13px;
`;

// @flow

import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

export const CardContent: ThemedComponent<{}> = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 1;
`;

export const CardHeaderContainer: ThemedComponent<{}> = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

export const CardHeader: ThemedComponent<{}> = styled(Text)`
  font-weight: 600;
  font-size: 12px;
  margin-left: 8px;
`;

export const CustomButton: ThemedComponent<{}> = styled(Button)`
  border: none;
  padding-right: 14px;
`;

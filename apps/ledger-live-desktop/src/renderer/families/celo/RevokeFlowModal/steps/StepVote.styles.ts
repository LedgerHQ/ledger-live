import Box from "~/renderer/components/Box";
import styled from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
export const ValidatorsFieldContainer: ThemedComponent<{}> = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  height: 270px;
`;

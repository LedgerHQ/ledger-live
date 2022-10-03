import styled from "styled-components";
import { system } from "styled-system";
export default styled.svg `
  ${system({
    fill: {
        property: "fill",
        scale: "colors",
    }
})}
`;

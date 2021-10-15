
import styled from "styled-components/native";
import { system } from "styled-system";

export default styled("svg")(
  system({
    fontSize: {
      property: "fill",
      scale: "colors",
    }
  })
);


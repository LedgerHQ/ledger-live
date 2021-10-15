
import styled from "styled-components/native";
import { system } from "styled-system";
import Svg from "react-native-svg";

export default styled(Svg)(
  system({
    fontSize: {
      property: 'fill',
      scale: 'colors',
    }
  })
);


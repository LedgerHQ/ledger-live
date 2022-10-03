import styled from "styled-components/native";
import { system } from "styled-system";
import Svg from "react-native-svg";
const fillSystem = system({
    fill: {
        property: "fill",
        scale: "colors",
    },
});
export default styled(Svg).attrs((props) => ({
    ...fillSystem(props),
})) ``;

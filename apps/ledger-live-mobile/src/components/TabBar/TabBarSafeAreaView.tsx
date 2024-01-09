import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { TAB_BAR_HEIGHT } from "./shared";
export { TAB_BAR_SAFE_HEIGHT } from "./shared";

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  padding-bottom: ${TAB_BAR_HEIGHT}px;
`;

export default StyledSafeAreaView;

import { StyleSheet } from "react-native";
import styled from "styled-components/native";
import NavigationScrollView from "../../components/NavigationScrollView";

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 64 },
});

export const SettingsNavigationScrollView = styled(NavigationScrollView).attrs({
  contentContainerStyle: styles.root,
})`
  padding: 0 ${p => p.theme.space[6]}px;
`;

export default SettingsNavigationScrollView;

import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  warningBox: {
    marginBottom: -8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
  label: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
    marginHorizontal: 8,
  },
});

export default styles;

import { StyleSheet } from "react-native";

export const stacksFlowStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  alert: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 24,
  },
  amountInputHeightGuard: {
    flexShrink: 1,
    minHeight: 160,
  },
  spacer: {
    flexGrow: 1,
  },
  details: {
    marginVertical: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
});

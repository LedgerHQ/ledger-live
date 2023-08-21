import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rewards: {
    height: 150,
    width: 150,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  howDelegationWorks: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});

export default styles;

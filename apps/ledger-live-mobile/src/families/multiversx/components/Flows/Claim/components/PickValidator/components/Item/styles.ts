import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconWrapper: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  nameText: {
    fontSize: 15,
  },
  subText: {
    fontSize: 13,
  },
  valueContainer: {
    alignItems: "flex-end",
  },
  value: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueLabel: {
    paddingHorizontal: 8,
    fontSize: 16,
  },
});

export default styles;

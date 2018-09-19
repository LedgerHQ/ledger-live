import { Platform } from "react-native";

export default (parseInt(Platform.Version, 10) < 11 ? 16 : 0);

import { createContext } from "react";
// ability to locally fallback to TouchableOpacity for edge-cases where
// rn-gesture-handler is not working properly (not triggering `onPress`),
// e.g inside a Modal
//
// issue has been raised here:
// https://github.com/kmagiera/react-native-gesture-handler/issues/139

export default createContext(false);

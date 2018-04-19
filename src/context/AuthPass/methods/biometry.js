import TouchID from "react-native-touch-id";

export default reason =>
  TouchID.authenticate(reason).catch(e => {
    console.warn(e);
    return false;
  });

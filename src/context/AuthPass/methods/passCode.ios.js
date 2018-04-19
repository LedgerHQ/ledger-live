import PasscodeAuth from "react-native-passcode-auth";

export default reason =>
  PasscodeAuth.authenticate(reason).catch(e => {
    console.warn(e);
    return false;
  });

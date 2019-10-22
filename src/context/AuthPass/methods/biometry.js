import FingerprintScanner from 'react-native-fingerprint-scanner';
import { Platform } from "react-native";
import unsupported from "./unsupported";

export default Platform.OS === "android" && Platform.Version < 23
  ? unsupported
  : FingerprintScanner;

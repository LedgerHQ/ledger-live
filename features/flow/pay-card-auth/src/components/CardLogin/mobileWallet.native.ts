import { Platform } from "react-native";
import type { MobileWallet } from "./types";

export const mobileWallet: MobileWallet = Platform.OS === "ios" ? "applePay" : "googlePay";

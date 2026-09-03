import { Platform } from "react-native";
import type { MobileWallet } from "./types";

/** The phone in hand is the phone the card is added to, so only its own wallet is worth naming. */
export const mobileWallet: MobileWallet = Platform.OS === "ios" ? "applePay" : "googlePay";

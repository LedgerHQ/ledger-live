import { Platform } from "react-native";
export function getFirebaseConfig() {
  // TODO change api key and other config
  if (Platform.OS === "android") {
    switch (process.env.NODE_ENV) {
      case "staging":
        return {
          apiKey: "AIzaSyDh7WKaA5cv",
          authDomain: "ledger-live-development.firebaseapp.com",
          projectId: "ledger-live-development",
          storageBucket: "ledger-live-development.appspot.com",
          messagingSenderId: "750497694072",
          appId: "1:750497694072:web:d2fc719100b45405bac88d",
        };
      case "production":
        return {
          apiKey: "AIzaSyDh7WKaA5cv",
          authDomain: "ledger-live-development.firebaseapp.com",
          projectId: "ledger-live-development",
          storageBucket: "ledger-live-development.appspot.com",
          messagingSenderId: "750497694072",
          appId: "1:750497694072:web:d2fc719100b45405bac88d",
        };
      default:
        return {
          apiKey: "AIzaSyDh7WKaA5cv",
          authDomain: "ledger-live-development.firebaseapp.com",
          projectId: "ledger-live-development",
          storageBucket: "ledger-live-development.appspot.com",
          messagingSenderId: "750497694072",
          appId: "1:750497694072:web:d2fc719100b45405bac88d",
        };
    }
  } else if (Platform.OS === "ios") {
    switch (process.env.NODE_ENV) {
      case "staging":
        return {
          apiKey: "AIzaSyDh7WKaA5cv",
          authDomain: "ledger-live-development.firebaseapp.com",
          projectId: "ledger-live-development",
          storageBucket: "ledger-live-development.appspot.com",
          messagingSenderId: "750497694072",
          appId: "1:750497694072:web:d2fc719100b45405bac88d",
        };
      case "production":
        return {
          apiKey: "AIzaSyDh7WKaA5cv",
          authDomain: "ledger-live-development.firebaseapp.com",
          projectId: "ledger-live-development",
          storageBucket: "ledger-live-development.appspot.com",
          messagingSenderId: "750497694072",
          appId: "1:750497694072:web:d2fc719100b45405bac88d",
        };
      default:
        return {
          apiKey: "AIzaSyDh7WKaA5cv",
          authDomain: "ledger-live-development.firebaseapp.com",
          projectId: "ledger-live-development",
          storageBucket: "ledger-live-development.appspot.com",
          messagingSenderId: "750497694072",
          appId: "1:750497694072:web:d2fc719100b45405bac88d",
        };
    }
  } else {
    throw new Error("Unsupported platform:" + Platform.OS);
  }
}

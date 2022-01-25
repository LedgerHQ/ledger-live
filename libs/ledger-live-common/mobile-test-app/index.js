import "./process";
import "./polyfill";
import "./engine";
import "./ledger";
import { AppRegistry } from "react-native";
import { name as appName } from "./app.json";
import { Root } from "./engine";

AppRegistry.registerComponent(appName, () => Root);

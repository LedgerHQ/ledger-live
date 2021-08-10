import implementLibcore from "../../../libcore/platforms/react-native";
// @ts-expect-error react native specific platform import
import { getNativeModule } from "./specific";
implementLibcore({
  getNativeModule,
});

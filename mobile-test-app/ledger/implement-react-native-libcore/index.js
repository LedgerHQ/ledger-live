// @flow
import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/react-native";
// $FlowFixMe
import { getNativeModule } from "./specific";

implementLibcore({ getNativeModule });

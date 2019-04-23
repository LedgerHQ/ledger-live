// @flow
import implementLibcore from "@ledgerhq/live-common/lib/libcore/platforms/react-native";
import { getNativeModule } from "./specific";

implementLibcore({ getNativeModule });

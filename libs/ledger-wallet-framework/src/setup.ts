import "@shared/live-env";
import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";

BigNumber.set({ DECIMAL_PLACES: getEnv<number>("BIG_NUMBER_DECIMAL_PLACES") });

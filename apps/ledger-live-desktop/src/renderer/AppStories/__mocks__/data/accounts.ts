import { fromAccountRaw } from "@ledgerhq/live-common/account/index";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import userdata from "../../../../../tests/userdata/1AccountBTC1AccountETHwCarousel.json";

export default userdata.data.accounts.map(({ data }) => fromAccountRaw(data as AccountRaw));

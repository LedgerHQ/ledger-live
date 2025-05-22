import { fn, Mock } from "@storybook/test";
import { Account as DetailedAccount } from "@ledgerhq/react-ui/pre-ldls/index";

export const useDetailedAccounts: Mock<
  () => { detailedAccounts: DetailedAccount[]; accounts: never[] }
> = fn();

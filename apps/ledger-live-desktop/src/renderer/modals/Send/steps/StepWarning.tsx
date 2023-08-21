import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { StepProps } from "../types";
import { getLLDCoinFamily } from "~/renderer/families";

const StepWarning = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account && getMainAccount(account, parentAccount);
  if (!mainAccount) return null;
  const module = getLLDCoinFamily(mainAccount.currency.family)?.sendWarning;
  if (!module) return null;
  const Comp = module.component as React.ComponentType<StepProps>;
  return <Comp {...props} />;
};

export const StepWarningFooter = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account && getMainAccount(account, parentAccount);
  if (!mainAccount) return null;
  const module = getLLDCoinFamily(mainAccount.currency.family)?.sendWarning;
  if (!module) return null;
  const Comp = module.footer;
  return <Comp {...props} />;
};

export default StepWarning;

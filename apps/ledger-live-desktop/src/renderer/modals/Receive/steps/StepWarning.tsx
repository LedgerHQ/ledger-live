import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { StepProps } from "../Body";
import { getLLDCoinFamily } from "~/renderer/families";

const StepWarning = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account && getMainAccount(account, parentAccount);
  if (!mainAccount) return null;
  const module = getLLDCoinFamily(mainAccount.currency.family)?.receiveWarning;
  if (!module) return null;
  const Comp = module.component;
  return <Comp {...props} />;
};

export const StepWarningFooter = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account && getMainAccount(account, parentAccount);
  if (!mainAccount) return null;
  const module = getLLDCoinFamily(mainAccount.currency.family)?.receiveWarning;
  if (!module) return null;
  const Comp = module.footer;
  return <Comp {...props} />;
};

export default StepWarning;

import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { StepProps } from "../Body";
import { useLLDCoinFamily } from "~/renderer/families";

const StepWarning = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account && getMainAccount(account, parentAccount);
  const specific = useLLDCoinFamily(mainAccount?.currency.family);
  if (!mainAccount) return null;
  const module = specific?.receiveWarning;
  if (!module) return null;
  const Comp = module.component;
  return <Comp {...props} />;
};

export const StepWarningFooter = (props: StepProps) => {
  const { account, parentAccount } = props;
  const mainAccount = account && getMainAccount(account, parentAccount);
  const specific = useLLDCoinFamily(mainAccount?.currency.family);
  if (!mainAccount) return null;
  const module = specific?.receiveWarning;
  if (!module) return null;
  const Comp = module.footer;
  return <Comp {...props} />;
};

export default StepWarning;

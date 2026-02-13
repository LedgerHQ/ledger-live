import { getDelegateAccount } from "../../api";

export const getDelegateAddress = async (address: string): Promise<string | undefined> => {
  const data = await getDelegateAccount(address);
  return data.data.account?.delegateAccount?.publicKey;
};

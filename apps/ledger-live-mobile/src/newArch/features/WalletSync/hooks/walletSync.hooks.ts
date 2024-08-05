import { resetTrustchainStore } from "@ledgerhq/trustchain/store";
import { useDispatch } from "react-redux";
import { TrustchainEjected, TrustchainNotAllowed } from "@ledgerhq/trustchain/errors";
import { ErrorType } from "./type.hooks";
import { useNavigation } from "@react-navigation/native";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";

export const useLifeCycle = () => {
  const dispatch = useDispatch();

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  function reset() {
    dispatch(resetTrustchainStore());
    navigation.navigate(ScreenName.WalletSyncActivationInit);
  }

  const includesErrorActions: { [key: string]: () => void } = {
    [ErrorType.NO_TRUSTCHAIN]: () => reset(),
  };

  function handleError(error: Error) {
    console.error("GetMember :" + error);

    if (error instanceof TrustchainEjected) reset();
    if (error instanceof TrustchainNotAllowed) reset();

    const errorToHandle = Object.entries(includesErrorActions).find(([err, _action]) =>
      error.message.includes(err),
    );

    if (errorToHandle) errorToHandle[1]();
  }

  return {
    handleError,
  };
};

import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import type { CryptosViewModel } from "../types";

export default function useCryptosViewModel(): CryptosViewModel {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const onAccountClick = useCallback(
    (account: AccountLike, parentAccount?: Account | null) => {
      setTrackingSource("cryptos page");
      navigate(
        parentAccount ? `/account/${parentAccount.id}/${account.id}` : `/account/${account.id}`,
      );
    },
    [navigate],
  );

  return {
    navigateToDashboard,
    searchValue,
    setSearchValue,
    onAccountClick,
  };
}

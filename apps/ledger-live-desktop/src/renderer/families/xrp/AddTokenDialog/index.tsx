import React, { useCallback, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { XrpFamily } from "../types";
import { closeAddToken, selectIsAddTokenOpen } from "./addTokenDialog";
import { ReviewToken } from "./ReviewToken";
import { SelectToken } from "./SelectToken";

function AddTokenDialogContent({ account }: Readonly<{ account: Account }>) {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsAddTokenOpen);
  const [token, setToken] = useState<TokenCurrency | null>(null);

  const onClose = useCallback(() => {
    setToken(null);
    dispatch(closeAddToken());
  }, [dispatch]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogBackgroundToneProvider>
          {token ? (
            <ReviewToken
              key={token.id}
              account={account}
              token={token}
              onBack={() => setToken(null)}
              onClose={onClose}
            />
          ) : (
            <SelectToken account={account} onSelect={setToken} onClose={onClose} />
          )}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}

const AddTokenDialog: NonNullable<XrpFamily["AccountDialog"]> = ({ account }) => {
  if (account.type !== "Account") return null;

  return <AddTokenDialogContent account={account} />;
};

export default AddTokenDialog;

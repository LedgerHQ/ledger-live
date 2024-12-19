import React, { useEffect } from "react";
import SelectableAccountsList from "~/components/SelectableAccountsList";

const ScannedAccountsSection = ({
  defaultSelected,
  ...rest
}: {
  defaultSelected?: boolean;
} & React.ComponentProps<typeof SelectableAccountsList>): JSX.Element => {
  useEffect(() => {
    if (defaultSelected && rest.onSelectAll) {
      rest.onSelectAll(rest.accounts);
    }
  }, [defaultSelected, rest]);
  return <SelectableAccountsList useFullBalance {...rest} />;
};

export default ScannedAccountsSection;

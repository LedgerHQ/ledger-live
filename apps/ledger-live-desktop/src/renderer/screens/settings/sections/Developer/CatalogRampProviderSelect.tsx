import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCatalogProvider } from "~/renderer/actions/settings";
import { catalogProviderSelector } from "~/renderer/reducers/settings";
import Select from "~/renderer/components/Select";
import Track from "~/renderer/analytics/Track";
import { providers } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/api/index";

type RemoteRampProvider = {
  value: string;
  url: string;
  label: string;
};
const CatalogRampProviderSelect = () => {
  const dispatch = useDispatch();
  const provider = useSelector(catalogProviderSelector);

  const avoidEmptyValue = (providerKey?: RemoteRampProvider | null) =>
    providerKey && handleChangeProvider(providerKey);

  const handleChangeProvider = useCallback(
    (providerKey: RemoteRampProvider) => {
      dispatch(setCatalogProvider(providerKey.value));
    },
    [dispatch],
  );

  const currentProvider = providers.find(option => option.value === provider);

  return (
    <>
      <Track onUpdate event="CatalogProviderSelect" currentProvider={provider} />
      <Select
        small
        minWidth={260}
        isSearchable={false}
        onChange={avoidEmptyValue}
        value={currentProvider}
        options={providers}
      />
    </>
  );
};

export default CatalogRampProviderSelect;

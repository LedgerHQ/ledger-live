/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Flex } from "@ledgerhq/react-ui";
import {
  LiveAppManifest,
  LiveAppManifestSchema,
  LiveAppManifestDappSchema,
  LiveAppManifestDapp,
  LiveAppManifestParamsNetwork,
  LiveAppManifestSchemaType,
} from "@ledgerhq/live-common/platform/types";
import Text from "~/renderer/components/Text";
import Switch from "~/renderer/components/Switch";
import FormLiveAppInput from "./FormLiveAppInput";
import NestedFormCategory from "./NestedFormCategory";
import updateObjectAtPath from "lodash/set";
import cloneDeep from "lodash/cloneDeep";
import FormLiveAppSelector from "./FormLiveAppSelector";
import FormLiveAppArrayInput from "./FormLiveAppArrayInput";
import { useCategories, useWalletAPICurrencies } from "@ledgerhq/live-common/wallet-api/react";
import { WalletAPICurrency } from "@ledgerhq/live-common/wallet-api/types";

import { useManifests } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import FormLiveAppArraySelect from "./FormLiveAppArraySelect";
import { Separator } from "~/renderer/components/Onboarding/Screens/SelectUseCase/Separator";
import { DEFAULT_FORM, DEFAULT_VALUES } from "./defaultValues";

import { objectKeysType } from "@ledgerhq/live-common/helpers";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";

function createLocalManifest() {
  return (
    <Modal
      width={600}
      name="MODAL_CREATE_LOCAL_APP"
      centered
      render={({ data, onClose }) => <FormLocalManifest data={data} onClose={onClose} />}
    />
  );
}

function FormLocalManifest({
  onClose,
}: {
  data: { manifest?: LiveAppManifest };
  onClose: () => void;
}) {
  const { addLocalManifest } = useLocalLiveAppContext();
  const [form, setForm] = useState<LiveAppManifest>(cloneDeep(DEFAULT_FORM));
  const [isDapp, setIsDapp] = useState("dapp" in form);

  const completeManifests = useManifests({ visibility: ["complete"] });
  const { categories } = useCategories(completeManifests);
  const walletAPICurrencies: WalletAPICurrency[] = useWalletAPICurrencies();

  DEFAULT_VALUES.categories = categories.filter((category: string) => category !== "all");
  DEFAULT_VALUES.currencies = walletAPICurrencies.map(currency => currency.id);

  const handleSwitchEthDapp = () => {
    setIsDapp(prevState => !prevState);
    setForm((prevState: LiveAppManifest) => {
      !isDapp
        ? (prevState.dapp = cloneDeep(DEFAULT_FORM.dapp) as LiveAppManifestDapp)
        : delete prevState.dapp;
      return prevState;
    });
  };

  const formIsValid = useMemo(() => LiveAppManifestSchema.safeParse(form).success, [form]);

  const handleChange = useCallback((path: string, value: unknown) => {
    setForm((prevState: LiveAppManifest) => {
      return updateObjectAtPath({ ...prevState }, path, value);
    });
  }, []);

  const submitHandler = (e: KeyboardEvent) => {
    e.preventDefault();
    if (e.detail !== 0) {
      formIsValid && addLocalManifest(form);
      onClose();
    }
  };

  const contentInput = useCallback(() => {
    return objectKeysType(form.content).map(contentKey => {
      const value = form.content[contentKey]?.en;
      if (value === undefined) return <></>;

      const parseCheck = LiveAppManifestSchema.shape.content.shape[contentKey].safeParse({
        en: value,
      }).success;
      const optional = LiveAppManifestSchema.shape.content.shape[contentKey].isOptional();
      const path = `content.${contentKey as string}.en`;

      return (
        <FormLiveAppInput
          key={contentKey as string}
          type={typeof value}
          fieldName={contentKey as string}
          value={value}
          optional={optional}
          parseCheck={parseCheck}
          path={path}
          handleChange={handleChange}
        />
      );
    });
  }, [form.content, handleChange]);

  const dappInput = useCallback(
    (dapp: NonNullable<LiveAppManifest["dapp"]>) => {
      return (
        <>
          <Separator></Separator>
          <Text ff="Inter|Bold" fontSize={4}>
            {`ETH Dapp`}
          </Text>
          {objectKeysType(dapp).map(dappKey => {
            if (dappKey === "networks") {
              return dapp.networks.map((networks: LiveAppManifestParamsNetwork, index: number) => {
                return (
                  <NestedFormCategory key={dappKey + index}>
                    <Text ff="Inter|Bold" fontSize={4}>
                      {`${dappKey} ${index + 1}`}
                    </Text>
                    {objectKeysType(networks).map(networkKey => {
                      const value = form.dapp?.networks[index][networkKey];
                      if (value === undefined) return <></>;

                      const networkKeySchema =
                        LiveAppManifestDappSchema.shape[dappKey].element.shape[networkKey];

                      const optional = networkKeySchema.isOptional();
                      const parseCheck = networkKeySchema.safeParse(value).success;
                      const path = `dapp.${dappKey}.${index}.${networkKey as string}`;

                      return (
                        <FormLiveAppInput
                          key={networkKey as string}
                          type={typeof value}
                          fieldName={networkKey as string}
                          value={value}
                          optional={optional}
                          parseCheck={parseCheck}
                          path={path}
                          handleChange={handleChange}
                        />
                      );
                    })}
                  </NestedFormCategory>
                );
              });
            }

            const value = form.dapp![dappKey];
            const path = `dapp.${dappKey as string}`;
            const shape = LiveAppManifestDappSchema.shape[dappKey];
            const parseCheck = shape.safeParse(value).success;
            const optional = shape.isOptional();

            if (dappKey === "provider") {
              return (
                <FormLiveAppSelector
                  optional={optional}
                  fieldName={dappKey}
                  key={dappKey}
                  choices={[...DEFAULT_VALUES[dappKey]]}
                  path={path}
                  handleChange={handleChange}
                  multipleChoices={false}
                  initalValue={value}
                ></FormLiveAppSelector>
              );
            }

            return (
              <FormLiveAppInput
                key={dappKey as string}
                type={typeof value}
                fieldName={dappKey as string}
                value={value}
                optional={optional}
                parseCheck={parseCheck}
                path={path}
                handleChange={handleChange}
                autoFocus={false}
              />
            );
          })}

          <Flex columnGap={2} justifyContent={"center"}>
            <Button
              small
              primary
              onClick={() => {
                setForm((prevState: LiveAppManifest) => {
                  const newNetwork = [...prevState.dapp!.networks];
                  newNetwork.push({ ...DEFAULT_FORM.dapp!.networks[0] });
                  return {
                    ...prevState,
                    dapp: { ...prevState.dapp, networks: newNetwork },
                  } as LiveAppManifest;
                });
              }}
            >
              {<Trans i18nKey={`settings.developer.createLocalAppModal.addNetwork`} />}
            </Button>
            <Button
              small
              danger
              disabled={form.dapp?.networks.length === 1}
              onClick={() => {
                setForm((prevState: LiveAppManifest) => {
                  const newNetwork = [...prevState.dapp!.networks];
                  newNetwork.pop();
                  return {
                    ...prevState,
                    dapp: { ...prevState.dapp, networks: newNetwork },
                  } as LiveAppManifest;
                });
              }}
            >
              {<Trans i18nKey={`settings.developer.createLocalAppModal.removeNetwork`} />}
            </Button>
          </Flex>
        </>
      );
    },
    [form.dapp, handleChange],
  );

  return (
    <form style={{ width: "90%", margin: "auto" }}>
      <ModalBody
        onClose={onClose}
        title={<Trans i18nKey={`settings.developer.createLocalAppModal.title.create`} />}
        render={() => (
          <>
            <ScrollArea>
              <Flex height={"65vh"} rowGap={15} flexDirection={"column"}>
                <Flex margin={"auto"} width={"max-content"} columnGap={2}>
                  <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
                    {`Wallet-API`}
                  </Text>
                  <Switch isChecked={isDapp} onChange={handleSwitchEthDapp} />
                  <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
                    {`ETH Dapp`}
                  </Text>
                </Flex>

                {objectKeysType(form).map((key, index) => {
                  if (key === "content") {
                    return contentInput();
                  }

                  if (key === "dapp") {
                    return dappInput(form.dapp!);
                  }

                  const value = form[key];
                  const isArray = Array.isArray(value);
                  const formKeySchema =
                    LiveAppManifestSchema.shape[key as keyof LiveAppManifestSchemaType];
                  const parseCheck = formKeySchema.safeParse(value).success;
                  const optional = formKeySchema.isOptional();
                  const path = `${key as string}`;

                  if (key === "platforms") {
                    return (
                      <FormLiveAppSelector
                        key={key}
                        optional={optional}
                        fieldName={key}
                        choices={[...DEFAULT_VALUES.platforms]}
                        path={path}
                        handleChange={handleChange}
                        multipleChoices={true}
                        initalValue={form[key]}
                      ></FormLiveAppSelector>
                    );
                  }

                  if (key === "apiVersion" || key === "manifestVersion") {
                    return <></>;
                  }

                  if (key === "visibility" || key === "branch") {
                    return (
                      <FormLiveAppSelector
                        key={key}
                        optional={optional}
                        fieldName={key}
                        choices={[...DEFAULT_VALUES[key]]}
                        path={path}
                        handleChange={handleChange}
                        multipleChoices={false}
                        initalValue={value as string}
                      ></FormLiveAppSelector>
                    );
                  }

                  if (key === "permissions" || key === "categories" || key === "currencies") {
                    return (
                      <FormLiveAppArraySelect
                        key={key as string}
                        options={[...DEFAULT_VALUES[key]]}
                        fieldName={key as string}
                        initialValue={value as string[]}
                        optional={optional}
                        parseCheck={parseCheck}
                        path={path}
                        handleChange={handleChange}
                      ></FormLiveAppArraySelect>
                    );
                  }

                  //FROM HERE, key IS NOT MATCHING ANY SPECIFIC FIELD ANYMORE

                  if (isArray) {
                    return (
                      <FormLiveAppArrayInput
                        key={key as string}
                        fieldName={key as string}
                        initialValue={[...value]}
                        optional={optional}
                        parseCheck={parseCheck}
                        path={path}
                        handleChange={handleChange}
                      ></FormLiveAppArrayInput>
                    );
                  }

                  return (
                    <FormLiveAppInput
                      key={key as string}
                      type={typeof value}
                      fieldName={key as string}
                      value={value}
                      optional={optional}
                      parseCheck={parseCheck}
                      path={path}
                      handleChange={handleChange}
                      autoFocus={index === 0}
                    />
                  );
                })}
              </Flex>
            </ScrollArea>
            <Flex marginTop={4} width={"100%"} justifyContent={"center"}>
              <Flex width={"100%"} flexDirection={"row"} columnGap={3} justifyContent={"center"}>
                <Button
                  small
                  disabled={!formIsValid}
                  primary
                  onClick={submitHandler}
                  data-test-id="create-local-manifest"
                >
                  {<Trans i18nKey={`settings.developer.createLocalAppModal.create`} />}
                </Button>
              </Flex>
            </Flex>
          </>
        )}
      />
    </form>
  );
}

export default createLocalManifest;

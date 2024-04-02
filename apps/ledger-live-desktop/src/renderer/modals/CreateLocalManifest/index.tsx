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
import { useLocalLiveAppContext } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import Switch from "~/renderer/components/Switch";
import FormLiveAppInput from "./FormLiveAppInput";
import NestedFormCategory from "./NestedFormCategory";
import updateObjectAtPath from "lodash/set";
import Selector from "./Selector";

const DEFAULT_FORM: LiveAppManifest = {
  id: "ReplaceAppName",
  author: "",
  private: false,
  name: "ReplaceAppName",
  url: "http://localhost:3000",
  homepageUrl: "http://localhost:3000/",
  supportUrl: "",
  icon: "",
  platforms: ["ios", "android", "desktop"],
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: ["NFT", "Swap", "YourAppCategory"],
  currencies: ["*"],
  highlight: false,
  content: {
    cta: { en: "" },
    subtitle: { en: "" },
    shortDescription: {
      en: "shortDescription",
    },
    description: {
      en: "description",
    },
  },
  domains: ["http://*"],
  visibility: "complete",
  permissions: [
    "account.list",
    "account.receive",
    "account.request",
    "currency.list",
    "device.close",
    "device.exchange",
    "device.transport",
    "message.sign",
    "transaction.sign",
    "transaction.signAndBroadcast",
    "wallet.capabilities",
    "wallet.info",
    "wallet.userId",
    "storage.get",
    "storage.set",
  ],
  dapp: {
    provider: "evm",
    nanoApp: "Ethereum",
    networks: [
      {
        currency: "ethereum",
        chainID: 1,
        nodeURL: "https://eth-dapps.api.live.ledger.com",
      },
    ],
  },
};

function createLocalManifest() {
  return (
    <Modal
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
  const [form, setForm] = useState<LiveAppManifest>({ ...DEFAULT_FORM });
  const [isDapp, setIsDapp] = useState("dapp" in form);

  const handleSwitchEthDapp = () => {
    setIsDapp(prevState => !prevState);
    setForm((prevState: LiveAppManifest) => {
      !isDapp
        ? (prevState.dapp = { ...DEFAULT_FORM.dapp } as LiveAppManifestDapp)
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

  return (
    <form onSubmit={() => formIsValid && addLocalManifest(form)}>
      <ModalBody
        onClose={onClose}
        title={<Trans i18nKey={`settings.developer.createLocalAppModal.title.create`} />}
        render={() => (
          <>
            <ScrollArea>
              <Flex height={"65vh"} rowGap={10} flexDirection={"column"}>
                <Flex margin={"auto"} width={"max-content"} columnGap={2}>
                  <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
                    {`Wallet-API`}
                  </Text>
                  <Switch isChecked={isDapp} onChange={handleSwitchEthDapp} />
                  <Text marginBottom={1} marginLeft={1} ff="Inter|Medium" fontSize={4}>
                    {`ETH Dapp`}
                  </Text>
                </Flex>
                {Object.keys(form)
                  .map(key => key as keyof LiveAppManifestSchemaType)
                  .map((key, index) => {
                    if (key === "content") {
                      return Object.keys(form[key])
                        .map(contentKey => contentKey as keyof LiveAppManifest["content"])
                        .map(contentKey => {
                          const value = form.content[contentKey]?.en;
                          if (value === undefined) return <></>;

                          const parseCheck = LiveAppManifestSchema.shape.content.shape[
                            contentKey
                          ].safeParse({ en: value }).success;
                          const optional =
                            LiveAppManifestSchema.shape.content.shape[contentKey].isOptional();
                          const path = `${key}.${contentKey}.en`;

                          return (
                            <>
                              <FormLiveAppInput
                                type={typeof value}
                                fieldName={contentKey}
                                value={value}
                                optional={optional}
                                parseCheck={parseCheck}
                                path={path}
                                handleChange={handleChange}
                              />
                            </>
                          );
                        });
                    }

                    if (key === "dapp") {
                      return (
                        <>
                          <NestedFormCategory>
                            <Text ff="Inter|Bold" fontSize={4}>
                              {`${key} `}
                            </Text>
                            {Object.keys(form.dapp!)
                              .map(dappKey => dappKey as keyof LiveAppManifestDapp)
                              .map(dappKey => {
                                if (dappKey === "networks") {
                                  return form.dapp?.networks.map(
                                    (networks: LiveAppManifestParamsNetwork, index: number) => {
                                      return (
                                        <NestedFormCategory key={dappKey + index}>
                                          <Text ff="Inter|Bold" fontSize={4}>
                                            {`${dappKey} ${index + 1}`}
                                          </Text>
                                          {Object.keys(networks)
                                            .map(
                                              networkKey =>
                                                networkKey as keyof LiveAppManifestParamsNetwork,
                                            )
                                            .map(networkKey => {
                                              const value = form.dapp?.networks[index][networkKey];
                                              if (value === undefined) return <></>;

                                              const networkKeySchema =
                                                LiveAppManifestDappSchema.shape[dappKey].element
                                                  .shape[networkKey];

                                              const optional = networkKeySchema.isOptional();
                                              const parseCheck =
                                                networkKeySchema.safeParse(value).success;
                                              const path = `${key}.${dappKey}.${index}.${networkKey}`;

                                              return (
                                                <FormLiveAppInput
                                                  key={networkKey}
                                                  type={typeof value}
                                                  fieldName={networkKey}
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
                                    },
                                  );
                                }

                                const value = form.dapp![dappKey];
                                const path = `${key}.${dappKey}`;
                                const shape = LiveAppManifestDappSchema.shape[dappKey];
                                const parseCheck = shape.safeParse(value).success;
                                const optional = shape.isOptional();

                                if (dappKey === "provider") {
                                  const enums = (shape._def as { values: string[] }).values;

                                  console.log(form.dapp);
                                  return (
                                    <Selector
                                      optional={optional}
                                      fieldName={dappKey}
                                      key={dappKey}
                                      choices={enums}
                                      path={path}
                                      handleChange={handleChange}
                                      multipleChoices={false}
                                      initalValue={value}
                                    ></Selector>
                                  );
                                }

                                return (
                                  <>
                                    <FormLiveAppInput
                                      type={typeof value}
                                      fieldName={dappKey}
                                      value={value}
                                      optional={optional}
                                      parseCheck={parseCheck}
                                      path={path}
                                      handleChange={handleChange}
                                      autoFocus={index === 0}
                                    />
                                  </>
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
                                {
                                  <Trans
                                    i18nKey={`settings.developer.createLocalAppModal.addNetwork`}
                                  />
                                }
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
                                {
                                  <Trans
                                    i18nKey={`settings.developer.createLocalAppModal.removeNetwork`}
                                  />
                                }
                              </Button>
                            </Flex>
                          </NestedFormCategory>
                        </>
                      );
                    }

                    const value = form[key];
                    const isArray = Array.isArray(value);
                    const valueType = isArray ? "comma-separated list" : typeof value;
                    const formKeySchema =
                      LiveAppManifestSchema.shape[key as keyof LiveAppManifestSchemaType];
                    const parseCheck = formKeySchema.safeParse(value).success;
                    const optional = formKeySchema.isOptional();
                    const path = `${key}`;

                    if (key === "platforms") {
                      const enums = formKeySchema._def.type._def.values;
                      return (
                        <Selector
                          key={key}
                          optional={optional}
                          fieldName={key}
                          choices={enums}
                          path={path}
                          handleChange={handleChange}
                          multipleChoices={true}
                          initalValue={form[key]}
                        ></Selector>
                      );
                    }

                    return (
                      <>
                        <FormLiveAppInput
                          type={valueType}
                          fieldName={key}
                          value={value}
                          optional={optional}
                          parseCheck={parseCheck}
                          path={path}
                          handleChange={handleChange}
                          isArray={isArray}
                          autoFocus={index === 0}
                        />
                      </>
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
                  onClick={() => {
                    formIsValid && addLocalManifest(form);
                    onClose();
                  }}
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

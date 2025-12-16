import React, { useReducer } from "react";
import styled from "styled-components";
import { Flex, Input, Text } from "@ledgerhq/react-ui";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useGenerateLocalBraze } from "../Hooks/useGenerateLocalBraze";
import { useTranslation } from "react-i18next";

type TabKey = "NotificationContentCard" | "ActionContentCard" | "PortfolioContentCard";

const FormRow = styled(Flex)`
  align-items: center;
  column-gap: 12px;
`;

const Label = styled(Text)`
  min-width: 120px;
`;

const FullWidthInput = styled(Input)`
  flex: 1;
  min-width: 630px;
`;

interface FormState {
  title: string;
  description: string;
  image: string;
  mainCta: string;
  link: string;
  secondaryCta: string;
  cta: string;
  tag?: string;
  url: string;
  path: string;
  order?: number;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string | number | boolean }
  | { type: "RESET_FORM" };

const initialState: FormState = {
  title: "Dummy Title",
  description: "Dummy Description",
  image:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQec1piP0de4iTT4LlWAg_SSU8DRv12XEfqwQ&s",
  mainCta: "Dummy Main CTA",
  link: "https://www.ledger.com/",
  secondaryCta: "Dummy Dismiss CTA",
  cta: "Dummy CTA",
  url: "https://www.ledger.com/",
  path: "https://www.ledger.com/",
  order: undefined,
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
};

export const ModalBody: React.FC = () => {
  const { t } = useTranslation();
  const [formData, dispatch] = useReducer(formReducer, initialState);

  const { addLocalPortfolioCard, addLocalActionCard, addLocalNotificationCard, dismissLocalCards } =
    useGenerateLocalBraze();

  const handleAddCard = () => {
    const { title, description, image, mainCta, link, secondaryCta, cta, tag, url, path, order } =
      formData;
    if (selectedTab === "PortfolioContentCard") {
      addLocalPortfolioCard(title, description, image, order, url, cta, tag);
    } else if (selectedTab === "ActionContentCard") {
      addLocalActionCard(title, description, image, mainCta, link, secondaryCta, order);
    } else if (selectedTab === "NotificationContentCard") {
      addLocalNotificationCard(title, description, cta, false, url, path, order);
    }
    dispatch({ type: "RESET_FORM" });
  };

  const handleChange = (field: keyof FormState, value: string | number | boolean) => {
    dispatch({ type: "SET_FIELD", field, value });
  };

  const handleInputChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(field, e.target.value);
    };

  const handleNumberChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(field, Number(e.target.value));
    };

  const tabs: { key: TabKey; label: string }[] = [
    {
      key: "NotificationContentCard",
      label: t("settings.developer.brazeTools.modal.fields.notification"),
    },
    {
      key: "ActionContentCard",
      label: t("settings.developer.brazeTools.modal.fields.action"),
    },
    {
      key: "PortfolioContentCard",
      label: t("settings.developer.brazeTools.modal.fields.portfolio"),
    },
  ];

  const [selectedTab, setSelectedTab] = useReducer(
    (state: TabKey, action: TabKey) => action,
    tabs[0].key,
  );

  const inputFields: Record<
    TabKey,
    { field: keyof FormState; placeholder: string; label: string }[]
  > = {
    PortfolioContentCard: [
      {
        field: "image",
        placeholder: "Image URL",
        label: t("settings.developer.brazeTools.modal.fields.image"),
      },
      {
        field: "url",
        placeholder: "URL",
        label: t("settings.developer.brazeTools.modal.fields.url"),
      },
      {
        field: "cta",
        placeholder: "CTA",
        label: t("settings.developer.brazeTools.modal.fields.cta"),
      },
      {
        field: "tag",
        placeholder: "TAG",
        label: t("settings.developer.brazeTools.modal.fields.tag"),
      },
    ],
    ActionContentCard: [
      {
        field: "image",
        placeholder: "Image URL",
        label: t("settings.developer.brazeTools.modal.fields.image"),
      },
      {
        field: "mainCta",
        placeholder: "Main CTA",
        label: t("settings.developer.brazeTools.modal.fields.mainCta"),
      },
      {
        field: "link",
        placeholder: "Link",
        label: t("settings.developer.brazeTools.modal.fields.link"),
      },
      {
        field: "secondaryCta",
        placeholder: "Secondary CTA",
        label: t("settings.developer.brazeTools.modal.fields.secondaryCta"),
      },
    ],
    NotificationContentCard: [
      {
        field: "cta",
        placeholder: "CTA",
        label: t("settings.developer.brazeTools.modal.fields.cta"),
      },
      {
        field: "url",
        placeholder: "URL",
        label: t("settings.developer.brazeTools.modal.fields.url"),
      },
      {
        field: "path",
        placeholder: "Path",
        label: t("settings.developer.brazeTools.modal.fields.path"),
      },
    ],
  };

  return (
    <Flex flexDirection="column" rowGap={24}>
      <Flex flexDirection="row" columnGap={24}>
        {tabs.map(tab => (
          <Button
            appearance={selectedTab === tab.key ? "accent" : "transparent"}
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </Flex>
      <Flex flexDirection="column" rowGap={12}>
        <FormRow>
          <Label> {t("settings.developer.brazeTools.modal.fields.title")}</Label>
          <FullWidthInput
            value={formData.title}
            onChangeEvent={handleInputChange("title")}
            placeholder="Title"
          />
        </FormRow>
        <FormRow>
          <Label>{t("settings.developer.brazeTools.modal.fields.description")}</Label>
          <FullWidthInput
            value={formData.description}
            onChangeEvent={handleInputChange("description")}
            placeholder="Description"
          />
        </FormRow>
        <FormRow>
          <Label> {t("settings.developer.brazeTools.modal.fields.order")}</Label>
          <FullWidthInput
            value={formData.order}
            onChangeEvent={handleNumberChange("order")}
            placeholder="Order"
            type="number"
          />
        </FormRow>
        {inputFields[selectedTab].map(({ field, placeholder, label }) => (
          <FormRow key={field}>
            <Label>{label}</Label>
            <FullWidthInput
              value={formData[field] ?? ""}
              onChangeEvent={handleInputChange(field)}
              placeholder={placeholder}
            />
          </FormRow>
        ))}
      </Flex>
      <Flex flexDirection="row" columnGap={24}>
        <Button size="sm" appearance="accent" onClick={handleAddCard}>
          {t("settings.developer.brazeTools.modal.add") +
            " " +
            tabs.find(tab => tab.key === selectedTab)?.label}
        </Button>
        <Button size="sm" appearance="red" onClick={dismissLocalCards}>
          {t("settings.developer.brazeTools.modal.dismiss")}
        </Button>
      </Flex>
    </Flex>
  );
};

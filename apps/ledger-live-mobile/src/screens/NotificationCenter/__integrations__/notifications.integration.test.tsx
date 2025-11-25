/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { NotificationCenterPages } from "./shared";
import { NotificationContentCard, ContentCardLocation } from "~/dynamicContent/types";
import { Linking, View } from "react-native";

jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

const logClickCard = jest.fn();
const logDismissCard = jest.fn();
const logImpressionCard = jest.fn();
const trackContentCardEvent = jest.fn();
const refreshDynamicContent = jest.fn();
const fetchData = jest.fn().mockResolvedValue(undefined);

const mockNotificationCards: NotificationContentCard[] = [
  {
    id: "french-with-cta",
    tag: "Test",
    title: "Notification de test",
    description:
      'Ceci est une notification de test avec un lien vers <a href="https://ledger.com">ledger.com</a> pour tester le rendu des liens HTML.',
    link: "https://ledger.com",
    cta: "Visiter",
    location: ContentCardLocation.NotificationCenter,
    createdAt: Date.now(),
    viewed: false,
  },
  {
    id: "french-without-cta",
    tag: "Info",
    title: "Notification sans CTA",
    description:
      'Description avec seulement <a href="https://ledger.com">lien HTML</a> dans le texte, sans CTA ni link dans l\'objet.',
    location: ContentCardLocation.NotificationCenter,
    createdAt: Date.now() - 1000,
    viewed: false,
  },
  {
    id: "russian-with-cta",
    tag: "Тест",
    title: "Тестовое уведомление",
    description:
      'Это тестовое уведомление с ссылкой на <a href="https://ledger.com">ledger.com</a> для проверки отображения HTML-ссылок. Пожалуйста, нажмите на <a href="https://ledger.com">эту ссылку</a> чтобы перейти на сайт.',
    link: "https://ledger.com",
    cta: "Посетить",
    location: ContentCardLocation.NotificationCenter,
    createdAt: Date.now() - 2000,
    viewed: false,
  },
  {
    id: "russian-without-cta",
    tag: "Инфо",
    title: "Уведомление без CTA",
    description: 'Текст с <a href="https://ledger.com">ссылкой</a> но без CTA и link в объекте',
    location: ContentCardLocation.NotificationCenter,
    createdAt: Date.now() - 3000,
    viewed: false,
  },
];

jest.mock("~/dynamicContent/useDynamicContent", () => ({
  __esModule: true,
  default: () => ({
    notificationCards: mockNotificationCards,
    mobileCards: [],
    walletCards: [],
    assetsCards: [],
    categoriesCards: [],
    logClickCard,
    logDismissCard,
    logImpressionCard,
    trackContentCardEvent,
    refreshDynamicContent,
  }),
}));

jest.mock("~/dynamicContent/useDynamicContentLogic", () => ({
  useDynamicContentLogic: () => ({
    fetchData,
    refreshDynamicContent,
  }),
}));

jest.mock("LLM/features/LNSUpsell", () => ({
  LNSUpsellBanner: (props: Record<string, unknown>) => (
    <View testID="lns-upsell-banner" {...(props as Record<string, unknown>)} />
  ),
  useLNSUpsellBannerState: () => ({
    isShown: false,
    params: undefined,
    tracking: "opted_out" as const,
  }),
}));

const renderNotificationCenter = () => render(<NotificationCenterPages />);

const expectTextVisible = async (text: string) => {
  const element = await screen.findByText(text);
  expect(element).toBeTruthy();
};

const expectAnyTextVisible = async (text: string) => {
  const elements = await screen.findAllByText(text);
  expect(elements.length).toBeGreaterThan(0);
  return elements;
};

type RenderingScenario = {
  name: string;
  assert: () => Promise<void>;
};

const renderingScenarios: RenderingScenario[] = [
  {
    name: "Should render French notifications with and without CTA",
    assert: async () => {
      await expectTextVisible("Notification de test");
      await expectAnyTextVisible("ledger.com");
      await expectTextVisible("Visiter");
      await expectTextVisible("Notification sans CTA");
      await expectTextVisible("lien HTML");
    },
  },
  {
    name: "Should render Russian notifications with and without CTA",
    assert: async () => {
      await expectAnyTextVisible("Тестовое уведомление");
      await expectTextVisible("Посетить");
      await expectTextVisible("Уведомление без CTA");
    },
  },
];

describe("NotificationCenter integration test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(renderingScenarios)("%s", async ({ assert }) => {
    renderNotificationCenter();
    await assert();
  });

  it("Should handle notification click with CTA", async () => {
    const { user } = renderNotificationCenter();

    const [ctaButton] = await expectAnyTextVisible("Visiter");

    await user.press(ctaButton);

    expect(logClickCard).toHaveBeenCalledWith("french-with-cta");
    expect(trackContentCardEvent).toHaveBeenCalledWith("contentcard_clicked", {
      screen: ContentCardLocation.NotificationCenter,
      link: "https://ledger.com",
      campaign: "french-with-cta",
      contentcard: "Notification de test",
    });
    expect(Linking.openURL).toHaveBeenCalledWith("https://ledger.com");
  });

  it("Should render HTML links in notification descriptions", async () => {
    renderNotificationCenter();

    // Check that HTML links are rendered as clickable elements
    await expectAnyTextVisible("ledger.com");
  });
});

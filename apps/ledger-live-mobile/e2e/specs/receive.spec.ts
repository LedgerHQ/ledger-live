import { expect } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import { loadConfig } from "../bridge/server";

let portfolioPage: PortfolioPage;


describe("Change Language", () => {
  const langButtonText = [
    { lang: "Français", localization: "Général" },
    { lang: "Español", localization: "General" },
    { lang: "Русский", localization: "Общие" },
    { lang: "Deutsch", localization: "Allgemeines" },
    { lang: "Português", localization: "Geral" },
    { lang: "Türkçe", localization: "Genel" },
    { lang: "简体中文", localization: "一般条款" },
    { lang: "한국어", localization: "일반" },
    { lang: "日本語", localization: "一般" },
  ];

  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
  });

  it("should tap Main Button", async () => {
    await portfolioPage.tapMainButton();
    await new Promise((resolve) => setTimeout(() => resolve("a"), 100000))
  });
});

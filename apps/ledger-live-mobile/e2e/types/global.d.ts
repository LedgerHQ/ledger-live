/* eslint-disable no-var */

import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

import { ElementHelpers } from "./helpers/elementHelpers";
import expect from "expect";

import { Application } from "./page";

type expectType = typeof expect;
type CurrencyType = typeof Currency;
type AccountType = typeof Account;

declare global {
  var app: Application;
  var jestExpect: expectType;
  var Currency: CurrencyType;
  var Account: AccountType;

  var waitForElementById: typeof ElementHelpers.waitForElementById;
  var waitForElementByText: typeof ElementHelpers.waitForElementByText;
  var getElementById: typeof ElementHelpers.getElementById;
  var getElementsById: typeof ElementHelpers.getElementsById;
  var getElementByText: typeof ElementHelpers.getElementByText;
  var getWebElementById: typeof ElementHelpers.getWebElementById;
  var getWebElementByTag: typeof ElementHelpers.getWebElementByTag;
  var IsIdVisible: typeof ElementHelpers.IsIdVisible;
  var tapById: typeof ElementHelpers.tapById;
  var tapByText: typeof ElementHelpers.tapByText;
  var tapByElement: typeof ElementHelpers.tapByElement;
  var typeTextById: typeof ElementHelpers.typeTextById;
  var typeTextByElement: typeof ElementHelpers.typeTextByElement;
  var clearTextByElement: typeof ElementHelpers.clearTextByElement;
  var performScroll: typeof ElementHelpers.performScroll;
  var scrollToText: typeof ElementHelpers.scrollToText;
  var scrollToId: typeof ElementHelpers.scrollToId;
  var getTextOfElement: typeof ElementHelpers.getTextOfElement;
  var getIdByRegexp: typeof ElementHelpers.getIdByRegexp;
  var getIdOfElement: typeof ElementHelpers.getIdOfElement;
  var getWebElementByTestId: typeof ElementHelpers.getWebElementByTestId;
  var getWebElementsByIdAndText: typeof ElementHelpers.getWebElementsByIdAndText;
  var getWebElementText: typeof ElementHelpers.getWebElementText;
  var getWebElementValue: typeof ElementHelpers.getWebElementValue;
  var waitWebElementByTestId: typeof ElementHelpers.waitWebElementByTestId;
  var tapWebElementByTestId: typeof ElementHelpers.tapWebElementByTestId;
  var typeTextByWebTestId: typeof ElementHelpers.typeTextByWebTestId;
}

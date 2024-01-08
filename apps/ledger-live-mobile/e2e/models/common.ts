import { getElementById, typeTextByElement } from "../helpers";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";

export default class Common {
  searchBarId = "common-search-field";
  searchBar = () => getElementById(this.searchBarId);

  async performSearch(text: string) {
    return typeTextByElement(this.searchBar(), text, false);
  }
}

export const formattedAmount = (unit: Unit, amount: BigNumber, showAllDigits = false) =>
  // amount formatted with the same unit as what the input should use
  formatCurrencyUnit(unit, amount, {
    showCode: true,
    showAllDigits: showAllDigits,
    disableRounding: false,
  });

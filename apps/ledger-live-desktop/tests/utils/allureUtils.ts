import { allure } from "allure-playwright";

export async function addTmsLink(ids: string[]) {
  for (const id of ids) {
    await allure.tms(id, `https://ledgerhq.atlassian.net/browse/${id}`);
  }
}

import { PageHolder } from "tests/page/abstractClasses";

export async function overrideNetworkPayload(
  pageHolder: PageHolder,
  url: string,
  updatePayload: (json: any) => any,
) {
  await pageHolder.getPage().route(url, async route => {
    const response = await route.fetch();
    const payload = await response.json();
    const newPayload = updatePayload(payload);
    await route.fulfill({ response, json: newPayload });
  });
}

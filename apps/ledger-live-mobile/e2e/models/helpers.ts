import { element, by } from "detox";

export function getElementByText(text: string) {
  return element(by.text(text));
}

export function getElementById(id: string) {
  return element(by.id(id));
}

export async function tapById(id: string, index?: number) {
  return element(by.id(id))
    .atIndex(index || 0)
    .tap();
}

export async function tapByText(text: string, index?: number) {
  return element(by.text(text))
    .atIndex(index || 0)
    .tap();
}

export async function tapByElement(
  elem: Detox.IndexableNativeElement,
  index = 0,
) {
  return elem.atIndex(index || 0).tap();
}

export async function typeTextById(id: string, text: string, focus = true) {
  if (focus) {
    await tapById(id);
  }
  return getElementById(id).typeText(text);
}

export async function typeTextByElement(
  elem: Detox.IndexableNativeElement,
  text: string,
  focus = true,
) {
  if (focus) {
    await tapByElement(elem);
  }

  await elem.typeText(text);
}

// export async function clearField(id: string) {
//   await getElementById(id).replaceText("");
// }

export function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("delay complete");
    }, ms);
  });
}

import {
  getElementById,
  getElementAttributes,
  tapByElement,
} from "../../helpers";

export default class ErrorElement {
  errorMessage = () => getElementById("error-message");

  // async getErrorText() {
  //   const attributes = await getElementAttributes(this.errorMessage());

  //   console.log("attrriiibbutess: ", { attributes });

  //   if (this.isElementAttribute(attributes)) {
  //     console.log("attrriiibbutess texxttt: ", attributes.text);
  //     return attributes.text;
  //   }

  //   return null;
  // }

  // async tapErrorMessage() {
  //   await tapByElement(this.errorMessage());
  // }

  // isElementAttribute = (
  //   o: any,
  // ): o is Detox.IosElementAttributes | Detox.AndroidElementAttributes => {
  //   return o && o.hasOwnProperty("text");
  // };
}

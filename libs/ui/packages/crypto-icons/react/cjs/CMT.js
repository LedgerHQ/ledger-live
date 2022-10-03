var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  default: () => CMT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#C1A05C";
function CMT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12.207 19.5c-1.74-.005-3.296-.539-4.687-1.56-.37-.272-.38-.428-.066-.766l.029-.03c.384-.417.382-.415.839-.086a6.422 6.422 0 003.617 1.234c1.385.048 2.657-.282 3.806-1.024 1.38-.89 2.32-2.129 2.714-3.71.494-1.986.127-3.825-1.175-5.442-.912-1.132-2.097-1.862-3.529-2.208a6.593 6.593 0 00-3.767.192 6.198 6.198 0 00-1.803.982c-.269.21-.37.206-.6-.05a4.286 4.286 0 01-.309-.377c-.14-.2-.121-.318.07-.47a7.729 7.729 0 013.086-1.48 7.595 7.595 0 013.108-.083c1.402.254 2.648.83 3.718 1.763.792.691 1.433 1.5 1.878 2.445.614 1.302.864 2.665.68 4.104a7.338 7.338 0 01-1.493 3.6c-.83 1.081-1.893 1.87-3.163 2.388a7.61 7.61 0 01-2.953.578zm-.477-4.787c-.05.076-.077.133-.119.177a1.32 1.32 0 01-.936.438c-.259.007-.519-.015-.777-.009-.1 0-.199.024-.287.072-1.195.75-2.482.86-3.838.572-.447-.095-.846-.266-1.187-.559-.256-.22-.437-.48-.459-.844-.037-.635.433-1.068.917-1.21.895-.263 1.746-.103 2.561.292.372.18.72.41 1.075.623.204.12.265.116.367-.092.461-.942.164-1.981-.963-2.365-.988-.338-1.955-.304-2.907.135-.14.064-.292.187-.457.055-.17-.138-.056-.302-.012-.447.312-1.053.63-2.104.951-3.154.071-.23.255-.349.523-.335.395.022.788.081 1.184.09.592.015 1.187.02 1.779-.009.44-.022.826-.216 1.166-.496.041-.034.124-.073.152-.055.04.026.063.1.067.155.028.455-.167.805-.529 1.077a2.44 2.44 0 01-1.449.486c-.553.012-1.105.02-1.657.022-.125.002-.19.047-.22.164-.05.195-.102.39-.158.585-.043.144.012.202.158.196.348-.013.696-.036 1.043-.034.8-.004 1.571.292 2.162.83.58.516.815 1.182.85 1.926.028.596-.086 1.167-.414 1.68-.089.14-.049.202.102.241.4.106.77.034 1.124-.163.03-.017.058-.035.088-.05.01-.004.026.001.1.006zm-3.426.17l-.012-.074c-.05-.03-.098-.069-.152-.093-.398-.176-.79-.37-1.198-.52-.416-.152-.849-.26-1.302-.155-.204.048-.408.1-.467.334-.066.259.092.42.276.561a.815.815 0 00.198.103c.701.27 1.412.277 2.126.066.183-.054.355-.148.531-.223z"
  }));
}
CMT.DefaultColor = DefaultColor;
var CMT_default = CMT;
//# sourceMappingURL=CMT.js.map

import { isSolanaExtraParameters } from "./utils";

describe("utils", () => {
  it.each([undefined, null, "some randon string", 1, 1n, true, () => {}])(
    "should return false when params is not an object",
    parameters => {
      expect(isSolanaExtraParameters(parameters)).toEqual(false);
    },
  );

  it("should return false when params has no data field", () => {
    expect(isSolanaExtraParameters({ templateId: "4c694669" })).toEqual(false);
  });

  it.each([undefined, null, 1, 1n, true, () => {}, {}])(
    "should return false when params data field has not the string type",
    data => {
      expect(isSolanaExtraParameters({ data, templateId: "4c694669" })).toEqual(false);
    },
  );

  it("should return false when params has no templateId field", () => {
    expect(
      isSolanaExtraParameters({
        data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAFCPiDNmtUDWDmpzydKi6FZkBCTfFwa2ZhTTdUevVi3unZHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTK9J7JKYcRyqUonWz7s7/VwlpZGFyeFTLBmH+1ZxNp+cQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAMj21sGUDT2OzVMrB//6y/Ap3NY91Ui6+A3L/o8oKfduAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFHqvVKc/tZwLbuBKegt7lflra0S51RjuBzG/zPwTDBgUDAAUCEOsJAAMACQOYOgAAAAAAAAQCBQYJAJrWKISI7LQABwIAAQwCAAAAi+sFAAAAAAAHAgACDAIAAADXHToJAAAAAAA=",
      }),
    ).toEqual(false);
  });

  it.each([undefined, null, 1, 1n, true, () => {}, {}])(
    "should return false when params templateId field has not the string type",
    templateId => {
      expect(
        isSolanaExtraParameters({
          data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAFCPiDNmtUDWDmpzydKi6FZkBCTfFwa2ZhTTdUevVi3unZHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTK9J7JKYcRyqUonWz7s7/VwlpZGFyeFTLBmH+1ZxNp+cQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAMj21sGUDT2OzVMrB//6y/Ap3NY91Ui6+A3L/o8oKfduAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFHqvVKc/tZwLbuBKegt7lflra0S51RjuBzG/zPwTDBgUDAAUCEOsJAAMACQOYOgAAAAAAAAQCBQYJAJrWKISI7LQABwIAAQwCAAAAi+sFAAAAAAAHAgACDAIAAADXHToJAAAAAAA=",
          templateId,
        }),
      ).toEqual(false);
    },
  );

  it("should return true when params has data and templateId fields as string", () => {
    expect(
      isSolanaExtraParameters({
        data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAFCPiDNmtUDWDmpzydKi6FZkBCTfFwa2ZhTTdUevVi3unZHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTK9J7JKYcRyqUonWz7s7/VwlpZGFyeFTLBmH+1ZxNp+cQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAKD0N0oI1T+8K47DiJ9N82JyiZvsX3fj3y3zO++Tr3FUGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAMj21sGUDT2OzVMrB//6y/Ap3NY91Ui6+A3L/o8oKfduAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFHqvVKc/tZwLbuBKegt7lflra0S51RjuBzG/zPwTDBgUDAAUCEOsJAAMACQOYOgAAAAAAAAQCBQYJAJrWKISI7LQABwIAAQwCAAAAi+sFAAAAAAAHAgACDAIAAADXHToJAAAAAAA=",
        templateId: "4c694669",
      }),
    ).toEqual(true);
  });
});

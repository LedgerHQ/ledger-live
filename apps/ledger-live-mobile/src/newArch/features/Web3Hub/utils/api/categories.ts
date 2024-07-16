import { mocks } from "./mocks/categories";

const MOCK_DELAY = 500;

export const fetchCategoriesMock = async () => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  return mocks;
};

export const selectCategories = (data: string[]) => {
  return ["all", ...data];
};

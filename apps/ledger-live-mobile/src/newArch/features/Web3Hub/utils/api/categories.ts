import network from "@ledgerhq/live-network/network";
import { mocks } from "./mocks/categories";

const MOCK_DELAY = 500;

export const fetchCategoriesMock = async () => {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  return mocks;
};

export const fetchCategories = async () => {
  const res = await network<{ categories: string[] }>({
    url: "https://manifest-api-git-feat-v2-search-ledgerhq.vercel.app/api/v2/categories",
  });
  return res.data.categories;
};

export const selectCategories = (data: string[]) => {
  return ["all", ...data];
};

import { getAllPosts, getAllCategories } from "../../../../.vitepress/theme/utils/getPostData.mjs";
import { getThemeConfig } from "../../../../.vitepress/init.mjs";

const categoriesData = getAllCategories(await getAllPosts());
const { postSize } = await getThemeConfig();
const postsPerPage = Math.max(1, Number(postSize) || 1);

export default {
  paths() {
    return Object.entries(categoriesData).flatMap(([name, category]) => {
      const length = Math.max(0, Math.ceil(category.count / postsPerPage) - 1);
      return Array.from({ length }, (_, index) => ({
        params: { name, num: String(index + 2) },
      }));
    });
  },
};

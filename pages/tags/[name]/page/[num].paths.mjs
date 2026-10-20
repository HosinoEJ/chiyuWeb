import { getAllPosts, getAllType } from "../../../../.vitepress/theme/utils/getPostData.mjs";
import { getThemeConfig } from "../../../../.vitepress/init.mjs";

const tagsData = getAllType(await getAllPosts());
const { postSize } = await getThemeConfig();
const postsPerPage = Math.max(1, Number(postSize) || 1);

export default {
  paths() {
    return Object.entries(tagsData).flatMap(([name, tag]) => {
      const length = Math.max(0, Math.ceil(tag.count / postsPerPage) - 1);
      return Array.from({ length }, (_, index) => ({
        params: { name, num: String(index + 2) },
      }));
    });
  },
};

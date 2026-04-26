const localImageModules = import.meta.glob("../images/*.{png,jpg,jpeg,webp,avif,gif}", {
  eager: true,
  import: "default",
});

const localImagesByName = Object.entries(localImageModules)
  .map(([path, url]) => ({
    fileName: path.split("/").pop(),
    url,
  }))
  .sort((a, b) => a.fileName.localeCompare(b.fileName))
  .reduce((acc, item) => {
    acc[item.fileName] = item.url;
    return acc;
  }, {});

const localImageList = Object.keys(localImagesByName).map((name) => localImagesByName[name]);

// Raw stories for fish nodes.
const storySeed = [
  {
    title: "相识",
    localFile: "story-05.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
    text: "那天屏幕的光很淡，你的头像轻轻闪烁，像故事的第一页。我们还不知道未来会发生什么，但命运已经悄悄开始书写。",
  },
  {
    title: "完美的合照",
    localFile: "story-01.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    text: "我们一起拍了很多照片，每一张都记录了我们的笑容和眼神。那些合照里藏着我们最真实的幸福。",
  },
  {
    title: "小晨的第一次摄影",
    localFile: "story-04.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    text: "出片出片--漂亮女朋友的追求之一。怀着无尽的忐忑，小晨开启了他的摄影生涯，咔擦咔擦！可谁能想到，小晨第一次摄影就取得大成功！",
  },
  {
    title: "漫步公园",
    localFile: "story-03.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
    text: "我们喜欢在周末一起去公园散步，感受自然的美好。每次走在绿树成荫的小径上，我们都觉得时间变得慢了下来，心也变得更近了。而这是我们第一次在公园漫步时拍下的照片。",
  },
  {
    title: "平凡的一天",
    localFile: "story-07.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    text: "没有特别安排的一天，我们一起做饭、聊天。在我眼中最温柔的幸福，不过就是和你共享普通日常。这是我们第一次共同做饭的记录！小晨做的糖醋排骨，小逸做的葱烧鸡！",
  },
  {
    title: "小逸第一张满意的合照",
    localFile: "story-06.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "我喜欢充满生活感的照片，小逸喜欢好看的照片，而这张又充满生活感又好看！",
  },
  {
    title: "上海健身房",
    localFile: "story-02.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "小逸陪小晨前往上海线下面试，这一天好幸福，晚上九点两人在健身房拍了这张照片，淡淡的幸福感。",
  },
];

const sharedStoryImage = localImagesByName["story-01.jpg"] || localImageList[0];

// Final normalized stories consumed by the UI.
export const stories = storySeed.map((story, index) => {
  const localByName = story.localFile ? localImagesByName[story.localFile] : undefined;

  return {
    title: story.title,
    image: localByName || sharedStoryImage || story.fallbackImage,
    text: story.text,
  };
});

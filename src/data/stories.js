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
    title: "忙碌过后",
    localFile: "story-05.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
    text: "4.28，泰州，忙碌一天后两人在休息时拍下了这张慵懒随意的照片",
  },
  {
    title: "南京咖啡馆的合照",
    localFile: "story-01.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    text: "4.13号下午，南京咖啡馆，这是我们第一次正式的合照，记录了我们相识不久的美好时光。",
  },
  {
    title: "小逸毕业啦！",
    localFile: "story-04.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    text: "4.28，泰州，小逸答辩结束的第二天，小晨赶到泰州一起拍下了这张穿着毕业服的照片！",
  },
  {
    title: "拼豆后",
    localFile: "story-03.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
    text: "4.24号下午，拼豆拼了一个下午，拼完回家途中拍下了这张照片，宝宝真好看！",
  },
  {
    title: "地铁搞怪",
    localFile: "story-07.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    text: "4.21晚，两人在地铁上，宝宝搞怪图片，好可爱！",
  },
  {
    title: "小逸第一张满意的合照",
    localFile: "story-06.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "4.12晚。我喜欢充满生活感的照片，小逸喜欢好看的照片，而这张又充满生活感又好看！",
  },
  {
    title: "上海健身房",
    localFile: "story-02.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "4.16日晚，小逸陪小晨前往上海线下面试，这一天好幸福，晚上九点两人在健身房拍了这张照片，淡淡的幸福感。",
  },
    {
    title: "小逸穿小晨衣服",
    localFile: "story-08.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "4.23日晚，小逸穿小晨衣服，随后小晨偷拍合照被嫌弃...",
  },
      {
    title: "偷拍被嫌弃",
    localFile: "story-09.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "4.13，小晨偷拍小逸，小逸觉得不好看不让我把这张照片放出来，我觉得很可爱，还是冒死放了出来",
  },
  {
    title: "三连拍",
    localFile: "story-10.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "4.13，咖啡馆三连拍！",
  },
    {
    title: "高铁包厢",
    localFile: "story-11.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "4.17日21:56，途径镇江时高铁车厢已无人，包厢合照！",
  },
  {
    title: "第一张拍立得",
    localFile: "story-12.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1200&q=80",
    text: "4.28，小晨和小逸拍下了第一张拍立得，小逸抿嘴了，但颇有纪念意义",
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

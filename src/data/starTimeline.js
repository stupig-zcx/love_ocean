const localImageModules = import.meta.glob("../images/*.{png,jpg,jpeg,webp,avif,gif}", {
  eager: true,
  import: "default",
});

const localImagesByName = Object.entries(localImageModules).reduce((acc, [path, url]) => {
  const fileName = path.split("/").pop();
  acc[fileName] = url;
  return acc;
}, {});

const localImageList = Object.keys(localImagesByName).map((name) => localImagesByName[name]);
const defaultImage =
  localImagesByName["story-01.jpg"] ||
  localImageList[0] ||
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1200&q=80";

const timelineSeed = [
  {
    date: "2024-02-14",
    title: "心动启动",
    metric: "聊天时长 4h 28m",
    text: "那天从晚饭后聊到深夜，话题像星星一样越聊越多，谁都不想先说晚安。",
    localFile: "story-01.jpg",
  },
  {
    date: "2024-03-03",
    title: "默契上升",
    metric: "同频指数 92%",
    text: "你还没说完，我就已经知道下一句；我刚开口，你就笑着接上了结尾。",
    localFile: "story-02.jpg",
  },
  {
    date: "2024-05-20",
    title: "小惊喜日",
    metric: "惊喜值 9.8/10",
    text: "准备了很久的小礼物终于送到你手里，你眼睛亮起来的那一刻像被点亮的小宇宙。",
    localFile: "story-03.jpg",
  },
  {
    date: "2024-07-11",
    title: "一起看雨",
    metric: "靠肩时长 37m",
    text: "窗外雨线很密，室内却很安静。那天我们靠在一起，把时间过成了慢动作。",
    localFile: "story-04.jpg",
  },
  {
    date: "2024-09-21",
    title: "生日夜空",
    metric: "幸福峰值 +1",
    text: "把生日愿望写在纸条上，系在星星旁边。你说愿望里每一条都和我们有关。",
    localFile: "story-05.jpg",
  },
  {
    date: "2024-12-31",
    title: "跨年倒数",
    metric: "倒数同步率 100%",
    text: "最后十秒我们一起数，零点那一刻没有大喊，只是看着彼此笑了很久。",
    localFile: "story-06.jpg",
  },
  {
    date: "2025-02-14",
    title: "周年纪念",
    metric: "纪念值 MAX",
    text: "把过去一年的小细节串起来，发现最珍贵的不是大事件，而是每天都在彼此身边。",
    localFile: "story-07.jpg",
  },
  {
    date: "2025-04-12",
    title: "未来清单",
    metric: "计划完成 1/21",
    text: "列了长长的愿望清单，从一起旅行到一起做饭，下一颗星星由我们亲手点亮。",
    localFile: "story-01.jpg",
  },
];

export const starTimeline = timelineSeed.map((item) => ({
  date: item.date,
  title: item.title,
  metric: item.metric,
  text: item.text,
  image: localImagesByName[item.localFile] || defaultImage,
}));


// Scene 2 timeline dataset: local image first, fallback to default.
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
    id: "star-2024-02-14",
    date: "2024-02-14",
    title: "Heartbeat Start",
    text: "Our first long-night chat turned a simple evening into the start of us.",
    localFile: "story-01.jpg",
  },
  {
    id: "star-2024-03-03",
    date: "2024-03-03",
    title: "Perfect Sync",
    text: "We kept finishing each other's sentences and laughing at the same moment.",
    localFile: "story-02.jpg",
  },
  {
    id: "star-2024-05-20",
    date: "2024-05-20",
    title: "Tiny Surprise",
    text: "A small gift and a bright smile became one of our favorite memories.",
    localFile: "story-03.jpg",
  },
  {
    id: "star-2024-07-11",
    date: "2024-07-11",
    title: "Rain Window",
    text: "Rain outside, silence inside, and the most peaceful shoulder to lean on.",
    localFile: "story-04.jpg",
  },
  {
    id: "star-2024-09-21",
    date: "2024-09-21",
    title: "Birthday Wish",
    text: "Every wish on that night quietly pointed to one future: us together.",
    localFile: "story-05.jpg",
  },
  {
    id: "star-2024-12-31",
    date: "2024-12-31",
    title: "Countdown",
    text: "At zero, we did not shout; we just looked at each other and smiled.",
    localFile: "story-06.jpg",
  },
  {
    id: "star-2025-02-14",
    date: "2025-02-14",
    title: "One Year",
    text: "The best part of the year was every ordinary day spent side by side.",
    localFile: "story-07.jpg",
  },
  {
    id: "star-2025-04-12",
    date: "2025-04-12",
    title: "Future List",
    text: "A long list of dreams, with one rule: complete every item together.",
    localFile: "story-01.jpg",
  },
];

// Final normalized timeline consumed by Scene 2.
export const starTimeline = timelineSeed.map((item) => ({
  id: item.id,
  date: item.date,
  title: item.title,
  text: item.text,
  image: localImagesByName[item.localFile] || defaultImage,
}));


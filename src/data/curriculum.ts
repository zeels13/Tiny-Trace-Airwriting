import type { AnimalFriend, Achievement, Lesson, World, WorldId } from "@/lib/types";
import {
  LETTER_GLYPHS,
  NUMBER_GLYPHS,
  SHAPE_GLYPHS,
  STROKE_GLYPHS,
  wordTemplate,
} from "./strokes";

export const WORLDS: World[] = [
  {
    id: "stroke-forest",
    index: 1,
    name: "Stroke Forest",
    tagline: "Lines, curves and first trails",
    kind: "stroke",
    guide: "caterpillar",
    theme: {
      surface: "bg-forest-soft",
      ink: "text-forest-deep",
      accent: "text-forest",
      path: "var(--tt-forest)",
    },
    lessonsToUnlockNext: 3,
  },
  {
    id: "shape-valley",
    index: 2,
    name: "Shape Valley",
    tagline: "Rocks, rings and pointy peaks",
    kind: "shape",
    guide: "turtle",
    theme: {
      surface: "bg-yellow/40",
      ink: "text-bark",
      accent: "text-yellow-deep",
      path: "var(--tt-yellow-deep)",
    },
    lessonsToUnlockNext: 3,
  },
  {
    id: "number-river",
    index: 3,
    name: "Number River",
    tagline: "Float downstream from 0 to 9",
    kind: "number",
    guide: "monkey",
    theme: {
      surface: "bg-sky/50",
      ink: "text-sky-deep",
      accent: "text-sky-deep",
      path: "var(--tt-sky-deep)",
    },
    lessonsToUnlockNext: 4,
  },
  {
    id: "alphabet-jungle",
    index: 4,
    name: "Alphabet Jungle",
    tagline: "Twenty-six letters in the leaves",
    kind: "letter",
    guide: "giraffe",
    theme: {
      surface: "bg-forest/15",
      ink: "text-forest-deep",
      accent: "text-forest",
      path: "var(--tt-forest-deep)",
    },
    lessonsToUnlockNext: 6,
  },
  {
    id: "word-safari",
    index: 5,
    name: "Word Safari",
    tagline: "Put letters together and read",
    kind: "word",
    guide: "lion",
    theme: {
      surface: "bg-coral-soft",
      ink: "text-coral",
      accent: "text-coral",
      path: "var(--tt-coral)",
    },
    lessonsToUnlockNext: 3,
  },
];

interface Seed {
  key: string;
  title: string;
  hint: string;
}

const STROKE_SEEDS: Seed[] = [
  { key: "horizontal", title: "Straight Trail", hint: "Follow my trail left to right." },
  { key: "vertical", title: "Tall Tree", hint: "Start at the top, slide down." },
  { key: "diagonal", title: "Hill Climb", hint: "Climb up to the sunshine." },
  { key: "curve", title: "Sleepy Hill", hint: "One smooth bump, nice and slow." },
  { key: "zigzag", title: "Zigzag Vine", hint: "Up, down, up again." },
];

const SHAPE_SEEDS: Seed[] = [
  { key: "circle", title: "Round Stone", hint: "Start at the top and go all the way round." },
  { key: "square", title: "Four Walls", hint: "Four straight lines, one at a time." },
  { key: "triangle", title: "Pointy Peak", hint: "Down, across, back up." },
  { key: "rectangle", title: "Long Log", hint: "Two long lines, two short ones." },
  { key: "oval", title: "Turtle Egg", hint: "A circle that stretched out." },
  { key: "star", title: "Night Star", hint: "Point to point, no stopping." },
  { key: "heart", title: "Kind Heart", hint: "Two humps, then meet at the bottom." },
];

const WORD_SEEDS: Seed[] = [
  { key: "CAT", title: "CAT", hint: "Three letters, one at a time." },
  { key: "SUN", title: "SUN", hint: "Warm up the jungle sky." },
  { key: "LION", title: "LION", hint: "That's me! Trace my name." },
  { key: "TREE", title: "TREE", hint: "Two tall lines in the middle." },
  { key: "NEST", title: "NEST", hint: "Home for the parrot." },
];

function makeLessons(): Lesson[] {
  const lessons: Lesson[] = [];

  STROKE_SEEDS.forEach((s, i) => {
    lessons.push({
      id: `stroke-${s.key}`,
      worldId: "stroke-forest",
      order: i + 1,
      title: s.title,
      hint: s.hint,
      kind: "stroke",
      template: STROKE_GLYPHS[s.key]!,
      xpReward: 20,
    });
  });

  SHAPE_SEEDS.forEach((s, i) => {
    lessons.push({
      id: `shape-${s.key}`,
      worldId: "shape-valley",
      order: i + 1,
      title: s.title,
      hint: s.hint,
      kind: "shape",
      template: SHAPE_GLYPHS[s.key]!,
      xpReward: 25,
    });
  });

  Object.keys(NUMBER_GLYPHS).forEach((digit, i) => {
    lessons.push({
      id: `number-${digit}`,
      worldId: "number-river",
      order: i + 1,
      title: `Number ${digit}`,
      hint: `Trace the ${digit} from the glowing dot.`,
      kind: "number",
      template: NUMBER_GLYPHS[digit]!,
      xpReward: 30,
    });
  });

  Object.keys(LETTER_GLYPHS).forEach((letter, i) => {
    lessons.push({
      id: `letter-${letter}`,
      worldId: "alphabet-jungle",
      order: i + 1,
      title: `Letter ${letter}`,
      hint: `Big ${letter} — watch the arrows first.`,
      kind: "letter",
      template: LETTER_GLYPHS[letter]!,
      xpReward: 35,
    });
  });

  WORD_SEEDS.forEach((s, i) => {
    lessons.push({
      id: `word-${s.key}`,
      worldId: "word-safari",
      order: i + 1,
      title: s.title,
      hint: s.hint,
      kind: "word",
      template: wordTemplate(s.key),
      xpReward: 45,
    });
  });

  return lessons;
}

export const LESSONS: Lesson[] = makeLessons();

export function lessonsForWorld(worldId: WorldId): Lesson[] {
  return LESSONS.filter((l) => l.worldId === worldId);
}

export function getWorld(worldId: string): World | undefined {
  return WORLDS.find((w) => w.id === worldId);
}

export function getLesson(lessonId: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === lessonId);
}

export const ANIMALS: AnimalFriend[] = [
  { id: "lion", name: "Rumi", role: "Your Tiny Trace friend", unlockHint: "Here from the start", unlockAtLessons: 0 },
  { id: "caterpillar", name: "Pip", role: "Stroke Forest guide", unlockHint: "Finish 1 trail", unlockAtLessons: 1 },
  { id: "butterfly", name: "Mira", role: "Trail cheerleader", unlockHint: "Finish 3 trails", unlockAtLessons: 3 },
  { id: "turtle", name: "Bo", role: "Shape Valley guide", unlockHint: "Finish 5 trails", unlockAtLessons: 5 },
  { id: "monkey", name: "Nio", role: "Number River guide", unlockHint: "Finish 8 trails", unlockAtLessons: 8 },
  { id: "parrot", name: "Kiko", role: "Sings your score", unlockHint: "Finish 12 trails", unlockAtLessons: 12 },
  { id: "giraffe", name: "Tala", role: "Alphabet Jungle guide", unlockHint: "Finish 16 trails", unlockAtLessons: 16 },
  { id: "elephant", name: "Ondo", role: "Word Safari helper", unlockHint: "Finish 22 trails", unlockAtLessons: 22 },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-trail", name: "First Trail", description: "You traced your very first trail.", motif: "leaf" },
  { id: "five-trails", name: "Trail Blazer", description: "Five trails finished.", motif: "paw" },
  { id: "perfect-stroke", name: "Steady Hand", description: "Scored 95 or more on a trail.", motif: "star" },
  { id: "streak-3", name: "Three Day Streak", description: "Practised three days in a row.", motif: "flame" },
  { id: "forest-clear", name: "Forest Cleared", description: "Every Stroke Forest trail done.", motif: "sun" },
  { id: "river-start", name: "River Rider", description: "Traced your first number.", motif: "river" },
];

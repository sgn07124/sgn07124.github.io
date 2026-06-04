export const BLOG_SERIES = {
  payment: {
    title: "test",
    posts: [
      { id: "blog/test", title: "test" },
    ]
  }
} as const;

export type SeriesKey = keyof typeof BLOG_SERIES;
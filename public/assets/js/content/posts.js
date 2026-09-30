/* =========================================================================
   Brio — The Journal: article index
   Each entry: slug, title, meta description (excerpt), ISO publish datetime,
   category, tags, featured image (local, CC/PD-licensed), reading time.
   Image credits: assets/img/blog/CREDITS.md
   ========================================================================= */
(function () {
  "use strict";

  window.BRIO_CATEGORIES = [
    { id: "research", label: "Research skills", blurb: "Finding, reading and judging sources." },
    { id: "reading", label: "Reading & retention", blurb: "Actually remembering what you read." },
    { id: "writing", label: "Academic writing", blurb: "Drafting, structure and editing." },
    { id: "references", label: "Referencing & integrity", blurb: "Citations, tools and avoiding accidents." },
    { id: "focus", label: "Focus & habits", blurb: "Attention, routines and energy." },
    { id: "campus", label: "Student life", blurb: "Money, admin and surviving the term." }
  ];

  var A = "Brio Editorial";

  window.BRIO_POSTS = [
    {
      slug: "how-to-read-20-papers-a-semester-without-burning-out",
      title: "How to read 20 research papers a semester without burning out",
      excerpt: "Three passes, ten minutes, one page of notes. A repeatable triage routine that tells you in ten minutes whether a paper deserves the next hour.",
      iso: "2026-09-28T09:30:00Z", cat: "research", featured: true, img: "b01",
      imgAlt: "Students reading at long tables in a university library reading room",
      tags: ["reading papers", "triage", "note-taking"], minutes: 9, author: A
    },
    {
      slug: "note-taking-that-survives-the-week",
      title: "Note-taking that survives the week",
      excerpt: "Most lecture notes die on Thursday. A one-line summary at the top of every page plus a weekly sweep keeps them usable until the exam.",
      iso: "2026-09-24T14:15:00Z", cat: "reading", img: "b02",
      imgAlt: "Close-up of a hand writing notes with a pen in an open notebook",
      tags: ["lectures", "summarising", "revision"], minutes: 7, author: A
    },
    {
      slug: "the-25-minute-study-block",
      title: "The 25-minute study block, and why yours keeps failing",
      excerpt: "The timer is not the problem — the missing first action is. Here is the four-sentence setup that makes a short block actually start.",
      iso: "2026-09-19T07:45:00Z", cat: "focus", img: "b03",
      imgAlt: "An open book beside a cup of coffee on a wooden table in morning light",
      tags: ["pomodoro", "starting", "attention"], minutes: 6, author: A
    },
    {
      slug: "reading-a-results-table-like-a-statistician",
      title: "Reading a results table like a statistician",
      excerpt: "Confidence intervals first, significance stars last. A field-by-field guide to the table sitting in the middle of almost every empirical paper.",
      iso: "2026-09-14T10:00:00Z", cat: "research", img: "b04",
      imgAlt: "A laptop showing charts and data analysis work on a desk",
      tags: ["statistics", "results", "critical reading"], minutes: 11, author: A
    },
    {
      slug: "a-study-desk-that-costs-less-than-15",
      title: "A study desk that costs less than $15",
      excerpt: "Two pens, one pad, one cheap timer. Everything you actually touch while working — and everything the stationery aisle convinces you to buy instead.",
      iso: "2026-09-09T16:20:00Z", cat: "focus", img: "b05",
      imgAlt: "Flat lay of pastel stationery with notebooks, pens and sticky notes",
      tags: ["desk setup", "budget", "stationery"], minutes: 5, author: A
    },
    {
      slug: "night-reading-without-wrecking-your-sleep",
      title: "Night reading without wrecking your sleep",
      excerpt: "Warm light, paper before screens, and a hard stop you can keep. How to fit evening reading around a body that needs to sleep.",
      iso: "2026-09-04T20:40:00Z", cat: "focus", img: "b06",
      imgAlt: "An open book lit by a warm desk lamp in a dark room",
      tags: ["sleep", "evening routine", "light"], minutes: 6, author: A
    },
    {
      slug: "library-skills-nobody-teaches-in-first-year",
      title: "Library skills nobody teaches you in first year",
      excerpt: "Interlibrary loans, subject databases, shelf browsing and the reference desk. Six things your induction week never mentioned.",
      iso: "2026-08-29T11:05:00Z", cat: "research", img: "b07",
      imgAlt: "Tall bookshelves inside a university library",
      tags: ["databases", "libraries", "search"], minutes: 8, author: A
    },
    {
      slug: "literature-review-spiral-method",
      title: "The spiral method for a literature review you can actually finish",
      excerpt: "Start with one good paper, follow its references backwards and its citations forwards, then stop when the circle closes. Scope without panic.",
      iso: "2026-08-24T09:10:00Z", cat: "writing", img: "b08",
      imgAlt: "A person writing in a journal with a pen in their lap",
      tags: ["literature review", "scope", "dissertation"], minutes: 12, author: A
    },
    {
      slug: "spreadsheets-for-humanities-students",
      title: "Spreadsheets for humanities students",
      excerpt: "Six formulas — countif, sumif, filter, vlookup, unique and sort — that cover almost everything a source-tracking sheet needs to do.",
      iso: "2026-08-18T13:25:00Z", cat: "research", img: "b09",
      imgAlt: "Documents and a laptop on a desk during data analysis work",
      tags: ["spreadsheets", "source tracking", "organisation"], minutes: 10, author: A
    },
    {
      slug: "morning-pages-for-researchers",
      title: "Morning pages for researchers, cut to five minutes",
      excerpt: "You do not need three longhand pages. Five minutes of unstructured writing before email clears the mental queue that blocks deep work.",
      iso: "2026-08-13T07:15:00Z", cat: "focus", img: "b10",
      imgAlt: "A book and a cup of coffee on a table in soft morning light",
      tags: ["morning routine", "journaling", "focus"], minutes: 5, author: A
    },
    {
      slug: "using-the-reading-room-as-a-tool",
      title: "Using the reading room as a tool, not a backdrop",
      excerpt: "Why silent rooms work, what to bring in with you, and the 90-minute rule that stops a study session turning into an endurance test.",
      iso: "2026-08-08T15:00:00Z", cat: "focus", img: "b11",
      imgAlt: "A grand academic study hall with long wooden tables and open books",
      tags: ["deep work", "environment", "libraries"], minutes: 6, author: A
    },
    {
      slug: "why-handwriting-notes-beat-typing",
      title: "Why handwriting your notes still beats typing",
      excerpt: "Handwriting is slower, and that is the point: the bottleneck forces you to compress ideas instead of transcribing words.",
      iso: "2026-08-02T10:35:00Z", cat: "reading", img: "b12",
      imgAlt: "A person taking handwritten notes on paper for better comprehension",
      tags: ["handwriting", "memory", "comprehension"], minutes: 7, author: A
    },
    {
      slug: "using-ai-without-losing-your-own-voice",
      title: "Using AI tools without losing your own voice",
      excerpt: "Where AI genuinely helps a literature search, and the three places it quietly corrupts an argument. With a disclosure template you can reuse.",
      iso: "2026-07-28T12:00:00Z", cat: "references", img: "b13",
      imgAlt: "A laptop displaying artificial intelligence software on a desk",
      tags: ["ai", "integrity", "disclosure"], minutes: 9, author: A
    },
    {
      slug: "building-an-evening-study-routine",
      title: "Building an evening study routine that lasts past week two",
      excerpt: "Evening work fails when it starts at the wrong hour. Anchor it to a fixed cue, cap it at 45 minutes, and end with a written next step.",
      iso: "2026-07-22T19:30:00Z", cat: "focus", img: "b14",
      imgAlt: "A library reading room at dusk with lit study lamps and wooden shelves",
      tags: ["routines", "evening", "habits"], minutes: 6, author: A
    },
    {
      slug: "colour-coding-that-still-makes-sense-in-december",
      title: "Colour coding that still makes sense in December",
      excerpt: "Three colours maximum, one meaning each, written down on the inside cover. Any more and you are decorating, not organising.",
      iso: "2026-07-16T09:55:00Z", cat: "reading", img: "b15",
      imgAlt: "Pastel sticky notes and pens arranged as a colour-coding system",
      tags: ["highlighting", "organisation", "revision"], minutes: 5, author: A
    },
    {
      slug: "writing-a-thesis-chapter-one-paragraph-at-a-time",
      title: "Writing a thesis chapter one paragraph at a time",
      excerpt: "Chapter-level paralysis dissolves at paragraph level. Here is the sentence skeleton I use to get a stalled draft moving again.",
      iso: "2026-07-09T10:20:00Z", cat: "writing", img: "b16",
      imgAlt: "A person writing notes at a wooden desk with a laptop behind them",
      tags: ["thesis", "drafting", "structure"], minutes: 11, author: A
    },
    {
      slug: "the-case-for-reading-one-book-slowly",
      title: "The case for reading one book slowly",
      excerpt: "How to read a book properly, and what to do with it. Four questions to ask a chapter before you turn the page.",
      iso: "2026-07-03T18:05:00Z", cat: "reading", img: "b17",
      imgAlt: "An open book beside a cup of tea in a quiet room",
      tags: ["slow reading", "comprehension", "questions"], minutes: 8, author: A
    },
    {
      slug: "exam-revision-that-starts-from-past-papers",
      title: "Exam revision that starts from past papers, not page one",
      excerpt: "Working backwards from the paper tells you which four chapters carry the marks. Everything else is optional reading.",
      iso: "2026-06-27T08:40:00Z", cat: "campus", img: "b18",
      imgAlt: "Organised exam preparation materials arranged on a desk",
      tags: ["exams", "past papers", "revision"], minutes: 9, author: A
    },
    {
      slug: "free-resources-hiding-in-your-own-university",
      title: "The free resources hiding in your own university",
      excerpt: "Writing centres, statistical advice, software licences, spare laptops and library workshops — all already paid for by your fees.",
      iso: "2026-06-20T14:10:00Z", cat: "campus", img: "b19",
      imgAlt: "A renovated campus library interior with study areas",
      tags: ["support", "money", "campus services"], minutes: 7, author: A
    },
    {
      slug: "triaging-your-to-do-list-when-everything-is-urgent",
      title: "Triaging your to-do list when everything is urgent",
      excerpt: "Sort by consequence, not by deadline. A two-minute triage that turns a forty-item list into three things you will actually do today.",
      iso: "2026-06-14T11:30:00Z", cat: "focus", img: "b20",
      imgAlt: "A person writing tasks on a sticky note at a tidy desk",
      tags: ["planning", "priorities", "deadlines"], minutes: 6, author: A
    },
    {
      slug: "searching-a-database-without-drowning",
      title: "Searching a database without drowning in 4,000 results",
      excerpt: "Boolean operators, field limits and one saved search. Build the query once, reuse it every term, and stop guessing at keywords.",
      iso: "2026-06-08T09:00:00Z", cat: "research", img: "b21",
      imgAlt: "A laptop open on a research and keyword planning workspace",
      tags: ["boolean", "databases", "search strategy"], minutes: 10, author: A
    },
    {
      slug: "the-weekly-review-that-takes-twenty-minutes",
      title: "The weekly review that takes twenty minutes",
      excerpt: "Empty the inbox, sweep the notes, pick the three deliverables for the week. Friday afternoon, one page, done.",
      iso: "2026-06-01T16:45:00Z", cat: "focus", img: "b22",
      imgAlt: "A desk with a laptop, notebook and journal under warm lighting",
      tags: ["weekly review", "planning", "admin"], minutes: 5, author: A
    },
    {
      slug: "a-wind-down-routine-for-busy-terms",
      title: "A wind-down routine for busy terms",
      excerpt: "Screens off, tea on, ten pages of something unrelated to your degree. The cheapest way to stop carrying the library to bed.",
      iso: "2026-05-25T21:10:00Z", cat: "campus", img: "b23",
      imgAlt: "A cup of tea and an open book beside a bed in the evening",
      tags: ["rest", "wellbeing", "reading for pleasure"], minutes: 6, author: A
    },
    {
      slug: "studying-in-a-group-without-wasting-an-afternoon",
      title: "Studying in a group without wasting an afternoon",
      excerpt: "Group study fails without roles. Assign a question-writer, a timekeeper and a note-taker before anyone opens a laptop.",
      iso: "2026-05-18T13:00:00Z", cat: "campus", img: "b24",
      imgAlt: "Students working together in a busy university study hall",
      tags: ["group work", "accountability", "roles"], minutes: 7, author: A
    }
  ];
})();

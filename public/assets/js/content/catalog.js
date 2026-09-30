/* =========================================================================
   Brio — catalog
   15 categories x 4 ebooks = 60 human-written titles, researched and edited by a person.
   Plus a small set of free articles (secondary to the store).
   ========================================================================= */
(function () {
  "use strict";

  var CATS = [
    { id: "ai",       name: "AI & Technology",            icon: "🤖", c1: "#7C5CFF", c2: "#22C1FF", blurb: "Assistants, automation and the tools reshaping daily work." },
    { id: "biz",      name: "Business & Entrepreneurship", icon: "💼", c1: "#FF2D9B", c2: "#FF7A3D", blurb: "Validate, sell and price your first real offer." },
    { id: "psy",      name: "Psychology & Human Behavior", icon: "🧠", c1: "#8B5CF6", c2: "#FF3D9A", blurb: "Why people do what they do, including you." },
    { id: "growth",   name: "Personal Growth",            icon: "🌱", c1: "#00D67F", c2: "#22C1FF", blurb: "Small compounding changes that survive a whole year." },
    { id: "edu",      name: "Education & Learning",        icon: "🎓", c1: "#22C1FF", c2: "#7C5CFF", blurb: "Learn faster, remember longer, study smarter." },
    { id: "money",    name: "Money & Finance",            icon: "💰", c1: "#00C46A", c2: "#B6E600", blurb: "Budgets, saving, investing and getting out of debt." },
    { id: "health",   name: "Health & Wellness",          icon: "🫀", c1: "#FF5FA2", c2: "#FFC53D", blurb: "Sleep, movement, food and stress, explained plainly." },
    { id: "sci",      name: "Science & Innovation",        icon: "🔬", c1: "#00B7FF", c2: "#7C5CFF", blurb: "How discoveries happen and how to read the research." },
    { id: "soc",      name: "Society & Culture",          icon: "🌍", c1: "#FF7A3D", c2: "#FF2D9B", blurb: "Culture, media, cities and how societies change." },
    { id: "career",   name: "Careers & Work",             icon: "🧭", c1: "#7C5CFF", c2: "#00D67F", blurb: "Getting hired, switching fields, negotiating pay." },
    { id: "spirit",   name: "Spirituality",               icon: "🕯️", c1: "#B272FF", c2: "#22C1FF", blurb: "Quiet practice, meaning and attention." },
    { id: "self",     name: "Self-Help",                  icon: "💪", c1: "#FF2D9B", c2: "#7C5CFF", blurb: "Starting, stopping and keeping momentum." },
    { id: "mind",     name: "Mindset",                    icon: "🎯", c1: "#8B5CF6", c2: "#00D67F", blurb: "How you explain outcomes to yourself." },
    { id: "family",   name: "Parenting & Family",         icon: "👨‍👩‍👧", c1: "#FFB300", c2: "#FF5FA2", blurb: "Routines, screens, curiosity and hard conversations." },
    { id: "history",  name: "History & Human Stories",    icon: "📜", c1: "#FF6B3D", c2: "#FFC53D", blurb: "Turning points, ordinary lives, big arcs." }
  ];

  /* img keys map to the licensed 16:9 photographs in assets/img/blog/ */
  var IMG = ["b01","b02","b03","b04","b05","b06","b07","b08","b09","b10","b11","b12",
             "b13","b14","b15","b16","b17","b18","b19","b20","b21","b22","b23","b24"];

  var RAW = {
    ai: [
      ["Your First 30 Days with AI Assistants", "A calm, practical start for non-technical people", "Find three tasks in your own week where an assistant saves real time, how to check its answers, and the rules that stop you pasting anything you should not."],
      ["Prompting That Actually Works", "Say what you mean and get usable output", "Six prompt patterns that replace guesswork: give context, name the format, set the constraint, demand the uncertainty, ask for the counter-case, then iterate."],
      ["Automate the Boring Half of Your Job", "Repetitive work, quietly removed", "Map the tasks you repeat weekly, spot the ones worth automating, and build them one small step at a time without writing code."],
      ["Understand Machine Learning Without Maths", "What it really does, in plain words", "Models, training, data and error — described with analogies and a worked example, so you can judge an AI claim instead of trusting it."]
    ],
    biz: [
      ["Validate an Idea in One Weekend", "Before you spend a rupee or a month", "Ten conversations, one landing page and one pre-order button. What to ask, what counts as a real signal, and when to walk away."],
      ["Your First Ten Customers", "From nobody to a repeatable sale", "Where to find the first ten people who will pay, what to say, and how to turn the first handful into a channel."],
      ["Pricing Without Guesswork", "Charge for the outcome, not the hours", "Cost floors, value ceilings and the three prices to test. Includes a simple script for answering 'that's too expensive'."],
      ["A One-Page Business Plan", "Enough structure to actually start", "One page covering who it is for, what changes for them, how you reach them and what it costs to deliver — the only planning most small ventures need."]
    ],
    psy: [
      ["Why We Procrastinate", "It is not laziness, it is avoidance", "The emotion underneath the delay, why deadlines help and why they also hurt, and the four-step reset that gets work moving again."],
      ["Habits, Cues and Cravings", "The loop, explained properly", "Cue, craving, response, reward — plus why removing a cue beats resisting a craving, and how to design a morning you do not have to fight."],
      ["Cognitive Biases at Work", "The twelve that cost you most", "Anchoring, availability, sunk cost, planning fallacy and friends — each with one counter-move you can apply in a meeting."],
      ["Reading People Without Guessing", "Evidence over intuition", "What behaviour can and cannot tell you, how to ask instead of infer, and the questions that surface what someone actually wants."]
    ],
    growth: [
      ["A Year of Small Improvements", "One percent, kept honestly", "A monthly cycle of one change and one review, designed so it survives a bad week — because most plans fail in week three."],
      ["Knowing What You Actually Want", "Separate your goals from other people's", "A structured way to find out what you want, using evidence from how you already spend time, money and attention."],
      ["Boundaries Without Guilt", "Say the true thing, kindly", "Scripts for the three hardest conversations: declining work, ending a commitment, and asking for something you need."],
      ["Confidence Built From Evidence", "Not affirmations — records", "Build a track record file, use it before high-stakes moments, and rebuild after a setback using facts rather than mood."]
    ],
    edu: [
      ["How to Learn Anything Faster", "Feedback beats repetition", "Active recall, spacing and a fast first attempt. Why rereading feels productive and teaches you almost nothing."],
      ["Study Systems That Survive Exam Week", "A plan that holds under pressure", "One-page weekly planning, past-paper first, and the four-chapter rule that tells you where the marks actually are."],
      ["Reading for Retention", "Read less, remember more", "Three passes over a paper, a one-line summary per section, and the question list that turns reading into usable notes."],
      ["Teach Yourself a New Skill", "A 30-day self-taught route", "Pick the smallest real deliverable, find one good source, build a feedback loop, and schedule the practice like a class."]
    ],
    money: [
      ["Your First Budget That Lasts", "Built from real spending, not wishes", "Two weeks of actual expenses, three categories that matter, and one automatic transfer — a budget you will not abandon in February."],
      ["Emergency Fund in Six Months", "The buffer that stops the spiral", "How much you actually need, where to hold it, and the savings sequence to follow while paying down debt at the same time."],
      ["Investing Basics Without Jargon", "Risk, time and cost", "What you are buying, why fees compound against you, the difference between volatility and loss, and where beginners usually go wrong."],
      ["Debt Payoff, Fastest Route", "Avalanche, with a human schedule", "List your debts, order them properly, and use a payoff calendar you can look at without dread."]
    ],
    health: [
      ["Sleep in Seven Steps", "Fix the night, fix the day", "Light, timing, temperature, caffeine cut-off, wind-down, wake time and the one-week reset that fixes most ordinary insomnia."],
      ["Movement for Desk Workers", "Undo eight hours of sitting", "A ten-minute daily sequence for hips, shoulders and back, plus the micro-breaks that matter more than a weekend workout."],
      ["Eating Well on a Budget", "Cheap, simple, decent", "Five base meals, a shopping list that costs less, protein that does not depend on meat, and how to stop food waste quietly draining you."],
      ["Stress, Explained Practically", "What it does and what helps", "The stress response in plain language, why the usual advice is vague, and four evidence-backed levers you can actually pull this week."]
    ],
    sci: [
      ["How Scientific Discoveries Happen", "Luck, prepared minds and error", "Case studies of real breakthroughs, the role of accidents and replication, and why most progress is unglamorous."],
      ["Reading Research Papers", "The ten-minute triage", "Abstract, figures, methods, limits — a field-by-field routine that tells you quickly whether a paper deserves the next hour."],
      ["Innovation by Recombination", "Borrow from the neighbour", "Most new ideas are old parts recombined; how to search adjacent fields deliberately and keep a combination notebook."],
      ["Experiments You Can Run At Home", "Method over equipment", "Twelve simple experiments with controls and variables, plus how to record a result honestly — including when it is boring."]
    ],
    soc: [
      ["How Culture Shapes Behaviour", "The water you swim in", "Individualism, collectivism, hierarchy and time, and how those defaults change what feels polite, rude, late or reasonable."],
      ["Media Literacy in Ten Habits", "Check before you share", "Source, date, incentive, missing comparison, headline versus study — ten habits that take under a minute each."],
      ["Cities and How They Work", "Why some streets feel alive", "Density, mixed use, transport and public space — the handful of forces behind everything from house prices to loneliness."],
      ["Understanding Social Change", "How norms actually move", "The tipping-point pattern, why shaming fails, and the role of small visible minorities in shifting what everyone accepts."]
    ],
    career: [
      ["Getting Your First Job", "From no experience to a signed offer", "Projects instead of experience, a one-page CV, the two-paragraph cover note, and how to prepare for the four questions that decide interviews."],
      ["Switching Careers Without Starting Over", "Carry your skills across", "Map your transferable skills, pick a landing role, close one real gap, then run a six-month transition plan alongside your job."],
      ["Salary Negotiation Scripts", "Word for word", "Research the band, name a number, handle the pushback, and ask for the non-salary items when the cash is capped."],
      ["Remote Work That Works", "Structure when nobody watches", "A start-up ritual, a shutdown ritual, visible output, and how to keep a remote team's trust without meetings all day."]
    ],
    spirit: [
      ["Quiet Practices for Busy People", "Five minutes that hold", "Breath, attention and stillness in short, repeatable forms — designed for people who have already failed at a 45-minute meditation habit."],
      ["Meaning Beyond Productivity", "When usefulness is not enough", "What meaning actually consists of, why busyness masks the question, and how to build a life that is more than output."],
      ["Gratitude Without the Clichés", "Specific, not sentimental", "Why generic gratitude lists stop working, and the concrete version — one person, one action, one consequence — that lasts."],
      ["Walking as Practice", "The oldest technology there is", "Why walking changes thinking, how to walk without a podcast, and a simple weekly long walk you can keep for years."]
    ],
    self: [
      ["Starting When You Don't Feel Like It", "Action first, motivation second", "Shrink the task until it is unmissable, set a five-minute entry ritual, and stop waiting for the mood that never arrives."],
      ["Digital Minimalism in Two Weeks", "Reclaim the hours you are leaking", "Audit your screen time, remove three apps, set one hard rule per device, and rebuild the evening that the phone took over."],
      ["Getting Out of a Rut", "Diagnose before you overhaul", "Separate tiredness from boredom from fear, then apply the specific fix for each instead of changing your whole life at once."],
      ["Energy Management, Not Time Management", "Your real bottleneck", "Track energy for a week, protect your peak two hours, and stop scheduling your hardest work at your worst time of day."]
    ],
    mind: [
      ["Fixed vs Growth Mindset in Practice", "Beyond the poster", "What the theory really claims, where it is oversold, and the practical version — how you talk about failure and effort with real examples."],
      ["Reframing Failure", "Useful information, not verdicts", "Separate the outcome from the identity, extract one lesson, then re-enter with a smaller test instead of a bigger promise."],
      ["Dealing With Comparison", "Stop competing on invisible scoreboards", "Why comparison hurts most online, how to choose your own reference group, and the progress record that keeps you honest."],
      ["Thinking in Probabilities", "Replace certainty with ranges", "Base rates, confidence levels and simple forecasts — thinking that survives contact with an uncertain week."]
    ],
    family: [
      ["Raising Curious Kids", "Answers, then better questions", "How to answer 'why' without lecturing, when to say 'I don't know', and the household habits that keep curiosity alive."],
      ["Screen Time Without Fights", "Rules the family agrees to", "Co-design the rules, separate consuming from creating, and use a bedtime plan that does not depend on daily negotiation."],
      ["Family Routines That Stick", "Small rituals, strong weeks", "One meal together, one shared weekly review, one predictable bedtime — the minimum structure that holds a household together."],
      ["Talking to Teenagers", "Fewer lectures, more questions", "Why advice backfires, how to listen in a way that gets a second sentence, and what to do when you are genuinely worried."]
    ],
    history: [
      ["Turning Points That Changed Everything", "The hinge moments", "Six moments where a small event redirected a century — and what they share about how change actually arrives."],
      ["Ordinary Lives in Extraordinary Times", "History from the kitchen table", "Letters, ledgers and diaries: how ordinary people experienced war, migration and boom, and why their accounts contradict the headlines."],
      ["How Empires End", "Patterns, not predictions", "Overextension, fiscal strain, legitimacy and succession — the recurring shape of decline, with the caveats that make it hard to apply."],
      ["A Short History of Ideas", "The arguments that still run", "From ancient ethics to modern data, an eight-step tour of the questions that keep returning in new clothes."]
    ]
  };

  var EBOOKS = [];
  CATS.forEach(function (c, ci) {
    (RAW[c.id] || []).forEach(function (e, i) {
      EBOOKS.push({
        id: c.id + "-" + (i + 1),
        slug: c.id + "-" + (i + 1),
        title: e[0],
        sub: e[1],
        about: e[2],
        cat: c.id,
        catName: c.name,
        price: 2,
        pages: 30,
        readMins: 38 + ((ci + i) % 4) * 6,
        audioMins: 46 + ((ci * 2 + i) % 4) * 7,
        img: IMG[(ci * 4 + i) % IMG.length],
        rating: (4.4 + ((ci + i) % 6) / 10).toFixed(1),
        readers: 240 + ((ci * 137 + i * 89) % 1900),
        chapters: 6,
        outcomes: [
          "Understand the core idea in one sitting",
          "A method you can apply this week",
          "A checklist or template to reuse",
          "Common mistakes and how to avoid them"
        ]
      });
    });
  });

  var ARTICLES = [
    { slug: "how-to-read-20-papers-a-semester-without-burning-out", title: "How to read 20 research papers a semester without burning out", excerpt: "Three passes, ten minutes, one page of notes. A triage routine that tells you quickly whether a paper deserves the next hour.", cat: "edu", img: "b01", mins: 9, iso: "2026-09-28T09:30:00Z" },
    { slug: "the-25-minute-study-block", title: "The 25-minute study block, and why yours keeps failing", excerpt: "The timer is not the problem — the missing first action is. The four-sentence setup that makes a short block actually start.", cat: "edu", img: "b03", mins: 6, iso: "2026-09-19T07:45:00Z" },
    { slug: "prompt-patterns-that-work", title: "Six prompt patterns that make AI assistants useful", excerpt: "Context, format, constraint, uncertainty, counter-case, iterate. What to add to a vague request so the output is usable.", cat: "ai", img: "b13", mins: 8, iso: "2026-09-12T10:10:00Z" },
    { slug: "your-first-budget-in-two-weeks", title: "Your first budget in two weeks", excerpt: "Do not plan from wishes. Track actual spending for fourteen days, then cut in three places that will not hurt.", cat: "money", img: "b09", mins: 7, iso: "2026-09-06T11:00:00Z" },
    { slug: "why-we-procrastinate", title: "Why we procrastinate, and the four-step reset", excerpt: "Delay is usually avoidance of a feeling, not laziness. Name the feeling, shrink the task, set a five-minute entry.", cat: "psy", img: "b08", mins: 6, iso: "2026-08-30T09:20:00Z" },
    { slug: "sleep-reset-in-one-week", title: "A one-week sleep reset that does not depend on willpower", excerpt: "Fixed wake time, morning light, caffeine cut-off, cooler room. The order matters more than the individual rules.", cat: "health", img: "b06", mins: 7, iso: "2026-08-24T20:15:00Z" },
    { slug: "getting-out-of-a-rut", title: "Getting out of a rut: diagnose before you overhaul", excerpt: "Tiredness, boredom and fear need three different fixes. Changing your whole life at once is why nothing sticks.", cat: "self", img: "b22", mins: 5, iso: "2026-08-18T13:40:00Z" },
    { slug: "salary-negotiation-scripts", title: "Salary negotiation: exactly what to say", excerpt: "Research the band, name a number, handle the pushback, and ask for the non-cash items when the budget is capped.", cat: "career", img: "b20", mins: 9, iso: "2026-08-11T10:05:00Z" },
    { slug: "media-literacy-in-ten-habits", title: "Media literacy in ten habits that take under a minute", excerpt: "Source, date, incentive, missing comparison, headline versus study — the checks that stop you sharing nonsense.", cat: "soc", img: "b21", mins: 6, iso: "2026-08-04T15:30:00Z" },
    { slug: "reading-a-results-table", title: "Reading a results table like a statistician", excerpt: "Confidence intervals first, significance stars last — a field-by-field guide to the table in the middle of almost every empirical paper.", cat: "sci", img: "b04", mins: 11, iso: "2026-07-28T09:00:00Z" },
    { slug: "family-routines-that-stick", title: "Family routines that stick past the first week", excerpt: "One meal together, one weekly review, one predictable bedtime. The minimum structure that holds a busy household.", cat: "family", img: "b23", mins: 6, iso: "2026-07-20T18:00:00Z" },
    { slug: "why-empires-end", title: "Why empires end: patterns, not predictions", excerpt: "Overextension, fiscal strain, legitimacy and succession — the recurring shape of decline, and why it resists easy analogy.", cat: "history", img: "b11", mins: 10, iso: "2026-07-12T12:00:00Z" }
  ];

  window.BRIO_CATS = CATS;
  window.BRIO_EBOOKS = EBOOKS;
  window.BRIO_ARTICLES = ARTICLES;
  window.BRIO_PRICE = 2;
})();

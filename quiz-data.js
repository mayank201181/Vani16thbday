// Shared by index.html (the quiz) and results.html (the scoreboard).

// Sends one scoreboard action to /api/quiz. Never throws; resolves to null on
// any failure so a tracking problem can never interrupt the quiz.
function trackCall(action, args) {
  return fetch("/api/quiz", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.assign({ action: action }, args))
  }).then(function (r) {
    return r.ok ? r.json().catch(function () { return null; }) : null;
  }).catch(function () { return null; });
}

const QUIZ = [
  {
    id: 1,
    triggerSec: 12,
    frameIdx: 1,
    question: "What is Vani's #1 go-to comfort food she can never say no to?",
    options: ["Pasta", "Sushi", "Butter chicken & naan", "Wood-fired pizza"],
    correctIndex: 0
  },
  {
    id: 2,
    triggerSec: 26,
    frameIdx: 2,
    question: "If you're grabbing a drink with Vani, what is she ordering?",
    options: ["Iced matcha latte", "Bubble tea", "Mango smoothie", "Iced caramel macchiato"],
    correctIndex: 1
  },
  {
    id: 3,
    triggerSec: 40,
    frameIdx: 3,
    question: "If Vani could teleport anywhere in the world for her Sweet 16, where would she go?",
    options: ["Switzerland", "South Korea", "Scotland", "Greece"],
    correctIndex: 2
  },
  {
    id: 4,
    triggerSec: 54,
    frameIdx: 4,
    question: "Out of all the places she's travelled so far, which trip is Vani's all-time favourite?",
    options: ["Japan", "New Zealand", "Bali", "Australia"],
    correctIndex: 3
  },
  {
    id: 5,
    triggerSec: 69,
    frameIdx: 5,
    question: "Which movie or series could Vani rewatch endlessly without getting bored?",
    options: ["Harry Potter", "Twilight", "The Hunger Games", "Gilmore Girls"],
    correctIndex: 1
  },
  {
    id: 6,
    triggerSec: 84,
    frameIdx: 6,
    question: "Who is Vani's top music artist on repeat right now?",
    options: ["Zara Larsson", "Olivia Rodrigo", "Sabrina Carpenter", "Dua Lipa"],
    correctIndex: 0
  },
  {
    id: 7,
    triggerSec: 99,
    frameIdx: 7,
    question: "On a completely free afternoon with zero homework, what is Vani most likely doing?",
    options: ["Sketching & painting", "Watching The Mentalist", "Baking desserts from scratch", "Scrolling TikTok for hours"],
    correctIndex: 1
  },
  {
    id: 8,
    triggerSec: 114,
    frameIdx: 8,
    question: "What is Vani's dream future career?",
    options: ["Aerospace engineer", "Corporate lawyer", "Psychologist", "Film director"],
    correctIndex: 2
  },
  {
    id: 9,
    triggerSec: 129,
    frameIdx: 9,
    question: "What is Vani's biggest pet peeve — the one thing that instantly annoys her?",
    options: ["Loud chewing", "People being late", "Slow walkers", "People who lie"],
    correctIndex: 3
  },
  {
    id: 10,
    triggerSec: 144,
    frameIdx: 10,
    question: "On a Sunday morning with zero plans, what time is Vani actually getting out of bed?",
    options: ["7:30 AM", "9:00 AM", "11:30 AM", "Past noon"],
    correctIndex: 1
  },
  {
    id: 11,
    triggerSec: 159,
    frameIdx: 11,
    question: "Which school subject does Vani genuinely enjoy the most?",
    options: ["Spanish", "Biology", "Computer Science", "Art & Design"],
    correctIndex: 0
  },
  {
    id: 12,
    triggerSec: 171.5,
    frameIdx: 12,
    question: "Out of all the wild adventures in this video, which memory did Vani love the most?",
    options: ["Flyboarding over the ocean", "Sea-walking with fish", "Feeding a kangaroo", "Meeting an elephant"],
    correctIndex: 2
  }
];

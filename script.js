const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const finishScreen = document.getElementById("finish-screen");

const startBtn = document.getElementById("start-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const soundToggleStart = document.getElementById("sound-toggle-start");
const soundToggle = document.getElementById("sound-toggle");

const questionArea = document.getElementById("question-area");
const answerArea = document.getElementById("answer-area");
const resultArea = document.getElementById("result-area");
const speechBubble = document.getElementById("speech-bubble");
const questionCount = document.getElementById("question-count");
const finishSummary = document.getElementById("finish-summary");
const finishStars = document.getElementById("finish-stars");

const allScreens = [startScreen, gameScreen, finishScreen];

const numbers = [12, 18, 24, 31, 36, 47, 52, 58, 63, 71, 75, 82, 89, 94, 26, 39, 41, 54, 67, 73, 85, 97, 14, 29, 43, 56, 68, 77, 88, 95];
const numberWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const tensWords = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const nameQuestionSeeds = [
  { digit: 6, place: "ones" },
  { digit: 6, place: "tens" },
  { digit: 4, place: "ones" },
  { digit: 4, place: "tens" },
  { digit: 7, place: "ones" },
  { digit: 7, place: "tens" },
  { digit: 3, place: "ones" },
  { digit: 3, place: "tens" },
  { digit: 8, place: "ones" },
  { digit: 8, place: "tens" }
];

const state = {
  questions: [],
  currentIndex: 0,
  soundEnabled: true,
  currentQuestion: null,
  answered: false,
  type1Selections: { 0: null, 1: null },
  type3Selection: null,
  type4Selection: null
};

function shuffleArray(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function buildNameChoices(answer, place) {
  const pool = place === "ones" ? numberWords.slice(1) : tensWords.slice(1);
  const distractors = shuffleArray(
    pool.filter((name) => name !== answer)
  ).slice(0, 3);

  return shuffleArray([answer, ...distractors]);
}

function buildNameQuestions() {
  return nameQuestionSeeds.map((seed, index) => {
    const answer = seed.place === "ones"
      ? numberWords[seed.digit]
      : tensWords[seed.digit];

    return {
      id: 1000 + index,
      type: "name",
      digit: seed.digit,
      place: seed.place,
      answer,
      choices: buildNameChoices(answer, seed.place)
    };
  });
}

function buildPlaceValueChoices(answer) {
  const distractorPool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  const distractors = shuffleArray(
    distractorPool.filter((value) => value !== answer)
  ).slice(0, 3);

  return shuffleArray([answer, ...distractors]).slice(0, 4);
}

function buildPlaceValueQuestions(targetCount = 12) {
  const candidates = [];
  const promptTemplates = [
    (digit, number) => `What is the value of ${digit} in ${number}?`,
    (digit, number) => `In ${number}, what is the value of ${digit}?`,
    (digit, number) => `How much is ${digit} worth in ${number}?`
  ];

  numbers.forEach((number, index) => {
    const tensDigit = Math.floor(number / 10);
    const onesDigit = number % 10;

    const tensPrompt = promptTemplates[index % promptTemplates.length](tensDigit, number);
    const onesPrompt = promptTemplates[(index + 1) % promptTemplates.length](onesDigit, number);

    candidates.push({
      id: 2000 + index * 2,
      type: "placevalue",
      number,
      digit: tensDigit,
      place: "tens",
      prompt: tensPrompt,
      answer: tensDigit * 10,
      choices: buildPlaceValueChoices(tensDigit * 10)
    });

    candidates.push({
      id: 2000 + index * 2 + 1,
      type: "placevalue",
      number,
      digit: onesDigit,
      place: "ones",
      prompt: onesPrompt,
      answer: onesDigit,
      choices: buildPlaceValueChoices(onesDigit)
    });
  });

  const tensQuestions = shuffleArray(candidates.filter((question) => question.place === "tens"));
  const onesQuestions = shuffleArray(candidates.filter((question) => question.place === "ones"));
  const balancedCount = Math.floor(targetCount / 2);

  return shuffleArray([
    ...tensQuestions.slice(0, balancedCount),
    ...onesQuestions.slice(0, balancedCount)
  ]);
}

function buildQuestionBank() {
  const numberQuestions = shuffleArray(numbers).slice(0, 6).map((number, index) => ({
    id: index + 1,
    type: "number",
    number
  }));

  const valueQuestions = shuffleArray(numbers).slice(0, 6).map((number, index) => ({
    id: 100 + index,
    type: "values",
    number
  }));

  const nameQuestions = buildNameQuestions().slice(0, 6);
  const placeValueQuestions = buildPlaceValueQuestions(12);

  return shuffleArray([
    ...numberQuestions,
    ...valueQuestions,
    ...nameQuestions,
    ...placeValueQuestions
  ]).slice(0, 30);
}

function showScreen(screenName) {
  allScreens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === `${screenName}-screen`);
  });
}

function updateSoundButtons() {
  const label = state.soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
  soundToggleStart.textContent = label;
  soundToggle.textContent = label;
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  updateSoundButtons();
  playClickTone();
}

function playClickTone() {
  if (!state.soundEnabled) return;
  playTone(440, 0.05, "triangle", 0.02);
}

function playCorrectTone() {
  if (!state.soundEnabled) return;
  const tones = [523.25, 659.25, 783.99, 1046.5];
  tones.forEach((tone, index) => {
    playTone(tone, 0.13, "triangle", index * 0.08 + 0.02);
  });
}

function playErrorTone() {
  if (!state.soundEnabled) return;
  playTone(260, 0.14, "sawtooth", 0.01);
  playTone(220, 0.14, "sawtooth", 0.12);
}

function playTone(frequency, duration, type, startDelay = 0) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.001;

  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime + startDelay;
  oscillator.start(now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.stop(now + duration + 0.02);
}

function setCharacterMood(mood) {
  const mascot = document.querySelector(".mascot");

  if (!mascot) {
    return;
  }

  mascot.classList.remove("correct", "incorrect");

  if (mood) {
    mascot.classList.add(mood);
  }
}

function startGame() {
  state.questions = buildQuestionBank();
  state.currentIndex = 0;
  state.currentQuestion = null;
  state.answered = false;
  state.type1Selections = { 0: null, 1: null };
  state.type3Selection = null;
  state.type4Selection = null;
  setCharacterMood("");
  showScreen("game");
  loadQuestion();
}

function loadQuestion() {
  state.currentQuestion = state.questions[state.currentIndex];
  state.answered = false;
  state.type1Selections = { 0: null, 1: null };
  state.type3Selection = null;
  state.type4Selection = null;
  setCharacterMood("");

  questionCount.textContent = `${state.currentIndex + 1} / ${state.questions.length}`;

  if (state.currentQuestion.type === "number") {
    speechBubble.textContent = "Pick the Tens and Ones for each digit.";
  } else if (state.currentQuestion.type === "values") {
    speechBubble.textContent = "Build the number from the Tens and Ones.";
  } else if (state.currentQuestion.type === "name") {
    speechBubble.textContent = "Choose the number name for the digit and place.";
  } else {
    speechBubble.textContent = "Choose the value of the digit.";
  }

  resultArea.innerHTML = "";
  answerArea.innerHTML = "";

  if (state.currentQuestion.type === "number") {
    questionArea.innerHTML = `<div class="number-display">${state.currentQuestion.number}</div>`;
    answerArea.innerHTML = buildType1Board(state.currentQuestion.number);
    attachType1Events();
  } else if (state.currentQuestion.type === "values") {
    const tens = Math.floor(state.currentQuestion.number / 10);
    const ones = state.currentQuestion.number % 10;
    questionArea.innerHTML = `
      <div class="value-question">
        <div class="value-stack">
          <div class="value-box">
            <span class="value-label">Tens</span>
            <span class="value-number">${tens}</span>
          </div>
          <div class="value-box">
            <span class="value-label">Ones</span>
            <span class="value-number">${ones}</span>
          </div>
        </div>
        <div class="prompt-text">What is the number?</div>
      </div>
    `;
    answerArea.innerHTML = buildType2Board();
    attachType2Events();
  } else if (state.currentQuestion.type === "name") {
    const placeLabel = state.currentQuestion.place === "tens" ? "Tens" : "Ones";
    const promptText = state.currentQuestion.place === "tens"
      ? `What does ${state.currentQuestion.digit} represent in the Tens place?`
      : `What is the value of ${state.currentQuestion.digit} in the Ones place?`;

    questionArea.innerHTML = `
      <div class="value-question">
        <div class="value-stack">
          <div class="value-box">
            <span class="value-label">Digit</span>
            <span class="value-number">${state.currentQuestion.digit}</span>
          </div>
          <div class="value-box">
            <span class="value-label">Place</span>
            <span class="value-number">${placeLabel}</span>
          </div>
        </div>
        <div class="prompt-text">${promptText}</div>
      </div>
    `;

    answerArea.innerHTML = buildType3Board(state.currentQuestion);
    attachType3Events();
  } else {
    questionArea.innerHTML = `
      <div class="value-question">
        <div class="value-stack">
          <div class="value-box">
            <span class="value-label">Number</span>
            <span class="value-number">${state.currentQuestion.number}</span>
          </div>
          <div class="value-box">
            <span class="value-label">Digit</span>
            <span class="value-number">${state.currentQuestion.digit}</span>
          </div>
        </div>
        <div class="prompt-text">${state.currentQuestion.prompt}</div>
      </div>
    `;

    answerArea.innerHTML = buildType4Board(state.currentQuestion);
    attachType4Events();
  }
}

function buildType1Board(number) {
  const tensDigit = Math.floor(number / 10);
  const onesDigit = number % 10;

  return `
    <div class="type1-board">
      <div class="digit-row" data-index="0">
        <div class="digit-spot">${tensDigit}</div>
        <div class="choice-pair">
          <button class="choice-btn" data-index="0" data-place="tens">Tens</button>
          <button class="choice-btn" data-index="0" data-place="ones">Ones</button>
        </div>
      </div>

      <div class="digit-row" data-index="1">
        <div class="digit-spot">${onesDigit}</div>
        <div class="choice-pair">
          <button class="choice-btn" data-index="1" data-place="tens">Tens</button>
          <button class="choice-btn" data-index="1" data-place="ones">Ones</button>
        </div>
      </div>

      <button class="check-btn" id="check-type1-btn">Check My Answer</button>
    </div>
  `;
}

function attachType1Events() {
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.answered) return;
      playClickTone();
      const index = Number(button.dataset.index);
      const place = button.dataset.place;
      state.type1Selections[index] = place;

      const rowButtons = document.querySelectorAll(`.choice-btn[data-index="${index}"]`);
      rowButtons.forEach((rowButton) => {
        rowButton.classList.toggle("selected", rowButton.dataset.place === place);
      });
    });
  });

  const checkBtn = document.getElementById("check-type1-btn");
  checkBtn.addEventListener("click", () => {
    if (state.answered) return;

    const selected0 = state.type1Selections[0];
    const selected1 = state.type1Selections[1];

    if (!selected0 || !selected1) {
      resultArea.innerHTML = `
        <div class="result-panel error">
          <h3>Choose both places first!</h3>
          <p>Pick Tens or Ones for each digit.</p>
        </div>
      `;
      return;
    }

    const correct = selected0 === "tens" && selected1 === "ones";

    if (correct) {
      state.answered = true;
      handleCorrectAnswer();
    } else {
      state.answered = true;
      handleIncorrectType1Answer();
    }
  });
}

function buildType2Board() {
  return `
    <div class="type2-board">
      <div class="answer-input-wrap">
        <span class="answer-label">Your number</span>
        <input id="answer-input" class="answer-input" type="text" inputmode="numeric" readonly placeholder="?" />
      </div>

      <div class="keypad">
        ${Array.from({ length: 10 }, (_, index) => `
          <button class="keypad-btn" data-digit="${index}">${index}</button>
        `).join("")}
        <button class="keypad-btn clear" data-action="clear">Clear</button>
        <button class="keypad-btn submit" id="submit-number-btn">Check My Answer</button>
      </div>
    </div>
  `;
}

function attachType2Events() {
  const keyButtons = document.querySelectorAll(".keypad-btn[data-digit]");
  keyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.answered) return;
      playClickTone();
      const input = document.getElementById("answer-input");
      if (input.value.length >= 2) return;
      input.value += button.dataset.digit;
    });
  });

  const clearBtn = document.querySelector(".keypad-btn.clear");
  clearBtn.addEventListener("click", () => {
    if (state.answered) return;
    playClickTone();
    const input = document.getElementById("answer-input");
    input.value = "";
    input.classList.remove("error");
  });

  const submitBtn = document.getElementById("submit-number-btn");
  submitBtn.addEventListener("click", () => {
    if (state.answered) return;

    const input = document.getElementById("answer-input");
    const answer = input.value.trim();

    if (!answer) {
      input.classList.add("error");
      resultArea.innerHTML = `
        <div class="result-panel error">
          <h3>Type the number first!</h3>
          <p>Build the number using the number buttons.</p>
        </div>
      `;
      return;
    }

    const numericAnswer = Number(answer);
    const correctValue = state.currentQuestion.number;

    if (numericAnswer === correctValue) {
      state.answered = true;
      handleCorrectAnswer();
    } else {
      state.answered = true;
      handleIncorrectType2Answer();
    }
  });
}

function buildType3Board(question) {
  return `
    <div class="type1-board">
      <div class="choice-pair">
        ${question.choices
          .map(
            (choice) => `
              <button class="choice-btn type3-choice" data-choice="${choice}">${choice}</button>
            `
          )
          .join("")}
      </div>
      <button class="check-btn" id="check-type3-btn">Check My Answer</button>
    </div>
  `;
}

function attachType3Events() {
  const buttons = document.querySelectorAll(".type3-choice");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.answered) return;
      playClickTone();
      state.type3Selection = button.dataset.choice;

      buttons.forEach((choiceButton) => {
        choiceButton.classList.toggle("selected", choiceButton.dataset.choice === state.type3Selection);
      });
    });
  });

  const checkBtn = document.getElementById("check-type3-btn");
  checkBtn.addEventListener("click", () => {
    if (state.answered) return;

    if (!state.type3Selection) {
      resultArea.innerHTML = `
        <div class="result-panel error">
          <h3>Choose an answer first!</h3>
          <p>Pick the correct number name.</p>
        </div>
      `;
      return;
    }

    if (state.type3Selection === state.currentQuestion.answer) {
      state.answered = true;
      handleCorrectAnswer();
    } else {
      state.answered = true;
      handleIncorrectType3Answer();
    }
  });
}

function buildType4Board(question) {
  return `
    <div class="type1-board">
      <div class="choice-pair">
        ${question.choices
          .map(
            (choice) => `
              <button class="choice-btn type4-choice" data-choice="${choice}">${choice}</button>
            `
          )
          .join("")}
      </div>
      <button class="check-btn" id="check-type4-btn">Check My Answer</button>
    </div>
  `;
}

function attachType4Events() {
  const buttons = document.querySelectorAll(".type4-choice");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.answered) return;
      playClickTone();
      state.type4Selection = button.dataset.choice;

      buttons.forEach((choiceButton) => {
        choiceButton.classList.toggle("selected", choiceButton.dataset.choice === state.type4Selection);
      });
    });
  });

  const checkBtn = document.getElementById("check-type4-btn");
  checkBtn.addEventListener("click", () => {
    if (state.answered) return;

    if (!state.type4Selection) {
      resultArea.innerHTML = `
        <div class="result-panel error">
          <h3>Choose an answer first!</h3>
          <p>Pick the correct value.</p>
        </div>
      `;
      return;
    }

    if (state.type4Selection === String(state.currentQuestion.answer)) {
      state.answered = true;
      handleCorrectAnswer();
    } else {
      state.answered = true;
      handleIncorrectType4Answer();
    }
  });
}

function handleCorrectAnswer() {
  setCharacterMood("correct");
  playCorrectTone();
  launchCelebration();
  speechBubble.textContent = "Great job! That's correct!";

  resultArea.innerHTML = `
    <div class="result-panel success">
      <h3>Great job! That's correct!</h3>
      <p>Nice work! Keep going.</p>
    </div>
  `;

  const nextButton = document.createElement("button");
  nextButton.className = "next-btn";
  nextButton.textContent = "Next Question";
  nextButton.addEventListener("click", nextQuestion);
  resultArea.appendChild(nextButton);
}

function handleIncorrectType1Answer() {
  setCharacterMood("incorrect");
  playErrorTone();
  speechBubble.textContent = "That's not correct. Try again.";

  const rows = document.querySelectorAll(".digit-row");
  rows.forEach((row) => {
    const rowIndex = Number(row.dataset.index);
    const rowButtons = row.querySelectorAll(".choice-btn");
    rowButtons.forEach((button) => {
      button.classList.remove("selected");
      if (rowIndex === 0 && button.dataset.place === "tens") {
        button.classList.add("correct");
      }
      if (rowIndex === 1 && button.dataset.place === "ones") {
        button.classList.add("correct");
      }
      if (button.dataset.place !== (rowIndex === 0 ? "tens" : "ones")) {
        button.classList.add("incorrect");
      }
    });
  });

  const tensDigit = Math.floor(state.currentQuestion.number / 10);
  const onesDigit = state.currentQuestion.number % 10;

  resultArea.innerHTML = `
    <div class="result-panel error">
      <h3>Correct Answer</h3>
      <p>${tensDigit} → Tens</p>
      <p>${onesDigit} → Ones</p>
    </div>
  `;

  const nextButton = document.createElement("button");
  nextButton.className = "next-btn";
  nextButton.textContent = "Next Question";
  nextButton.addEventListener("click", nextQuestion);
  resultArea.appendChild(nextButton);
}

function handleIncorrectType2Answer() {
  setCharacterMood("incorrect");
  playErrorTone();
  speechBubble.textContent = "That's not correct. Try again.";

  const input = document.getElementById("answer-input");
  if (input) {
    input.classList.add("error");
  }

  resultArea.innerHTML = `
    <div class="result-panel error">
      <h3>Correct Answer</h3>
      <p>${state.currentQuestion.number}</p>
    </div>
  `;

  const nextButton = document.createElement("button");
  nextButton.className = "next-btn";
  nextButton.textContent = "Next Question";
  nextButton.addEventListener("click", nextQuestion);
  resultArea.appendChild(nextButton);
}

function handleIncorrectType3Answer() {
  setCharacterMood("incorrect");
  playErrorTone();
  speechBubble.textContent = "That's not correct. Try again.";

  const buttons = document.querySelectorAll(".type3-choice");
  buttons.forEach((button) => {
    button.classList.remove("selected");

    if (button.dataset.choice === state.currentQuestion.answer) {
      button.classList.add("correct");
    }

    if (button.dataset.choice === state.type3Selection) {
      button.classList.add("incorrect");
    }
  });

  resultArea.innerHTML = `
    <div class="result-panel error">
      <h3>Correct Answer</h3>
      <p>${state.currentQuestion.answer}</p>
    </div>
  `;

  const nextButton = document.createElement("button");
  nextButton.className = "next-btn";
  nextButton.textContent = "Next Question";
  nextButton.addEventListener("click", nextQuestion);
  resultArea.appendChild(nextButton);
}

function handleIncorrectType4Answer() {
  setCharacterMood("incorrect");
  playErrorTone();
  speechBubble.textContent = "That's not correct. Try again.";

  const buttons = document.querySelectorAll(".type4-choice");
  buttons.forEach((button) => {
    button.classList.remove("selected");

    if (button.dataset.choice === String(state.currentQuestion.answer)) {
      button.classList.add("correct");
    }

    if (button.dataset.choice === state.type4Selection) {
      button.classList.add("incorrect");
    }
  });

  resultArea.innerHTML = `
    <div class="result-panel error">
      <h3>Correct Answer</h3>
      <p>${state.currentQuestion.answer}</p>
    </div>
  `;

  const nextButton = document.createElement("button");
  nextButton.className = "next-btn";
  nextButton.textContent = "Next Question";
  nextButton.addEventListener("click", nextQuestion);
  resultArea.appendChild(nextButton);
}

function nextQuestion() {
  state.currentIndex += 1;

  if (state.currentIndex < state.questions.length) {
    loadQuestion();
  } else {
    finishGame();
  }
}

function finishGame() {
  showScreen("finish");
  finishSummary.textContent = "You completed the Place Value Challenge!";
  finishStars.innerHTML = "⭐ ⭐ ⭐ ⭐ ⭐";
  setCharacterMood("");
}

function launchCelebration() {
  const overlay = document.createElement("div");
  overlay.className = "celebration-overlay";
  overlay.innerHTML = '<div class="burst">✨ ✨ ✨</div>';
  document.body.appendChild(overlay);

  setTimeout(() => overlay.remove(), 900);
}

startBtn.addEventListener("click", () => {
  playClickTone();
  startGame();
});

soundToggleStart.addEventListener("click", toggleSound);
soundToggle.addEventListener("click", toggleSound);
playAgainBtn.addEventListener("click", () => {
  playClickTone();
  startGame();
});

updateSoundButtons();
showScreen("start");

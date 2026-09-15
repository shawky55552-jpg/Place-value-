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

const numbers = Array.from({ length: 1000 }, (_, number) => number);
const numberWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const placeLabels = ["Hundreds", "Tens", "Ones"];

const state = {
  questions: [],
  currentIndex: 0,
  soundEnabled: true,
  currentQuestion: null,
  answered: false,
  type1Selections: { 0: null, 1: null, 2: null },
  selectedChoice: null
};

function shuffleArray(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function buildChoices(answer, maximum = 999) {
  const distractorPool = Array.from({ length: maximum + 1 }, (_, value) => value);
  const distractors = shuffleArray(
    distractorPool.filter((value) => value !== answer)
  ).slice(0, 3);

  return shuffleArray([answer, ...distractors]).slice(0, 4);
}

function buildPlaceValueQuestions(targetCount = 6) {
  const candidates = [];
  const promptTemplates = [
    (digit, number) => `What is the value of ${digit} in ${number}?`,
    (digit, number) => `In ${number}, what is the value of ${digit}?`,
    (digit, number) => `How much is ${digit} worth in ${number}?`
  ];

  numbers.forEach((number, index) => {
    const digits = getDigits(number);
    const place = index % 3;
    const digit = digits[place];
    const multiplier = 10 ** (2 - place);
    candidates.push({
      id: 2000 + index,
      type: "placevalue",
      number,
      digit,
      place,
      prompt: promptTemplates[index % promptTemplates.length](digit, number),
      answer: digit * multiplier,
      choices: buildChoices(digit * multiplier)
    });
  });

  return shuffleArray(candidates).slice(0, targetCount);
}

function getDigits(number) {
  return [Math.floor(number / 100), Math.floor(number / 10) % 10, number % 10];
}

function buildPlaceQuestions(targetCount = 6) {
  return shuffleArray(numbers).slice(0, targetCount).map((number, index) => {
    const place = index % 3;
    const answer = getDigits(number)[place];
    return { id: 3000 + index, type: "place", number, place, answer, prompt: `How many ${placeLabels[place]} are in ${number}?`, choices: buildChoices(answer, 9) };
  });
}

function buildDigitQuestions(targetCount = 6) {
  return shuffleArray(numbers).slice(0, targetCount).map((number, index) => {
    const place = (index + 1) % 3;
    const answer = getDigits(number)[place];
    return { id: 4000 + index, type: "digit", number, place, answer, prompt: `What digit is in the ${placeLabels[place]} place in ${number}?`, choices: buildChoices(answer, 9) };
  });
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

  const placeValueQuestions = buildPlaceValueQuestions(6);
  const placeQuestions = buildPlaceQuestions(6);
  const digitQuestions = buildDigitQuestions(6);

  return shuffleArray([
    ...numberQuestions,
    ...valueQuestions,
    ...placeValueQuestions,
    ...placeQuestions,
    ...digitQuestions
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
  state.type1Selections = { 0: null, 1: null, 2: null };
  state.selectedChoice = null;
  setCharacterMood("");
  showScreen("game");
  loadQuestion();
}

function loadQuestion() {
  state.currentQuestion = state.questions[state.currentIndex];
  state.answered = false;
  state.type1Selections = { 0: null, 1: null, 2: null };
  state.selectedChoice = null;
  setCharacterMood("");

  questionCount.textContent = `${state.currentIndex + 1} / ${state.questions.length}`;

  if (state.currentQuestion.type === "number") {
    speechBubble.textContent = "Match each digit to its place.";
  } else if (state.currentQuestion.type === "values") {
    speechBubble.textContent = "Build the number from the place values.";
  } else if (state.currentQuestion.type === "placevalue") {
    speechBubble.textContent = "Find what the digit is worth.";
  } else {
    speechBubble.textContent = "Read the number carefully.";
  }

  resultArea.innerHTML = "";
  answerArea.innerHTML = "";

  if (state.currentQuestion.type === "number") {
    questionArea.innerHTML = `<div class="number-display">${state.currentQuestion.number}</div>`;
    answerArea.innerHTML = buildType1Board(state.currentQuestion.number);
    attachType1Events();
  } else if (state.currentQuestion.type === "values") {
    const [hundreds, tens, ones] = getDigits(state.currentQuestion.number);
    questionArea.innerHTML = `
      <div class="value-question">
        <div class="value-stack">
          <div class="value-box">
            <span class="value-label">Hundreds</span>
            <span class="value-number">${hundreds}</span>
          </div>
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
  } else if (["placevalue", "place", "digit"].includes(state.currentQuestion.type)) {
    questionArea.innerHTML = `
      <div class="value-question">
        <div class="value-stack">
          <div class="value-box">
            <span class="value-label">Number</span>
            <span class="value-number">${state.currentQuestion.number}</span>
          </div>
          ${state.currentQuestion.type === "placevalue" ? `
            <div class="value-box">
              <span class="value-label">Digit</span>
              <span class="value-number">${state.currentQuestion.digit}</span>
            </div>
          ` : ""}
        </div>
        <div class="prompt-text">${state.currentQuestion.prompt}</div>
      </div>
    `;

    answerArea.innerHTML = buildChoiceBoard(state.currentQuestion);
    attachChoiceEvents();
  }
}

function buildType1Board(number) {
  const digits = getDigits(number);

  return `
    <div class="type1-board">
      ${digits.map((digit, index) => `
      <div class="digit-row" data-index="${index}">
        <div class="digit-spot">${digit}</div>
        <div class="choice-pair">
          ${placeLabels.map((place, placeIndex) => `<button class="choice-btn" data-index="${index}" data-place="${placeIndex}">${place}</button>`).join("")}
        </div>
      </div>
      `).join("")}

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

    const selected = [0, 1, 2].map((index) => state.type1Selections[index]);

    if (selected.some((place) => place === null)) {
      resultArea.innerHTML = `
        <div class="result-panel error">
          <h3>Choose all three places first!</h3>
          <p>Pick Hundreds, Tens, or Ones for each digit.</p>
        </div>
      `;
      return;
    }

    const correct = selected.every((place, index) => Number(place) === index);

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
      if (input.value.length >= 3) return;
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

function buildChoiceBoard(question) {
  return `
    <div class="type1-board">
      <div class="choice-pair">
        ${question.choices
          .map(
            (choice) => `
              <button class="choice-btn answer-choice" data-choice="${choice}">${choice}</button>
            `
          )
          .join("")}
      </div>
      <button class="check-btn" id="check-choice-btn">Check My Answer</button>
    </div>
  `;
}

function attachChoiceEvents() {
  const buttons = document.querySelectorAll(".answer-choice");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (state.answered) return;
      playClickTone();
      state.selectedChoice = button.dataset.choice;

      buttons.forEach((choiceButton) => {
        choiceButton.classList.toggle("selected", choiceButton.dataset.choice === state.selectedChoice);
      });
    });
  });

  const checkBtn = document.getElementById("check-choice-btn");
  checkBtn.addEventListener("click", () => {
    if (state.answered) return;

    if (state.selectedChoice === null) {
      resultArea.innerHTML = `
        <div class="result-panel error">
          <h3>Choose an answer first!</h3>
          <p>Choose one of the answers.</p>
        </div>
      `;
      return;
    }

    if (Number(state.selectedChoice) === state.currentQuestion.answer) {
      state.answered = true;
      handleCorrectAnswer();
    } else {
      state.answered = true;
      handleIncorrectChoiceAnswer();
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
      if (Number(button.dataset.place) === rowIndex) {
        button.classList.add("correct");
      }
      if (Number(button.dataset.place) !== rowIndex) {
        button.classList.add("incorrect");
      }
    });
  });

  const digits = getDigits(state.currentQuestion.number);

  resultArea.innerHTML = `
    <div class="result-panel error">
      <h3>Correct Answer</h3>
      ${digits.map((digit, index) => `<p>${digit} → ${placeLabels[index]}</p>`).join("")}
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

function handleIncorrectChoiceAnswer() {
  setCharacterMood("incorrect");
  playErrorTone();
  speechBubble.textContent = "That's not correct. Try again.";

  const buttons = document.querySelectorAll(".answer-choice");
  buttons.forEach((button) => {
    button.classList.remove("selected");

    if (Number(button.dataset.choice) === state.currentQuestion.answer) {
      button.classList.add("correct");
    }

    if (button.dataset.choice === state.selectedChoice) {
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

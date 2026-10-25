var speedSlider = document.getElementById("settings-speed-slider");
var speedValueLabel = document.getElementById("settings-speed-value");
var setters = null;
var explode = null;
var resizeCanvas = null;

function fitCanvas() {
  if (!resizeCanvas) return; // wasm jeszcze niegotowy
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = Math.max(1, Math.round(window.innerWidth * dpr));
  var h = Math.max(1, Math.round(window.innerHeight * dpr));
  resizeCanvas(w, h);
}
window.addEventListener("resize", fitCanvas);
Module.onRuntimeInitialized = function () {
  setters = {
    rotSpeed: Module.cwrap("changeRotSpeed", null, ["number"]),
  };

  speedSlider.disabled = false;
  setters.rotSpeed(parseFloat(speedSlider.value));

  explode = Module.cwrap("explode", null, null);
  resizeCanvas = Module.cwrap("resizeCanvas", null, ["number", "number"]);

  fitCanvas();
};

speedSlider.addEventListener("input", () => {
  var value = parseFloat(speedSlider.value);
  speedValueLabel.textContent = value.toFixed(1) + "x";
  if (setters) {
    setters.rotSpeed(value);
  }
});
function handleIconTap(icon, window) {
  if (icon.classList.contains("selected")) {
    icon.classList.remove("selected");
    selectedIcon = undefined;
    openWindow(window);
    explode();
  } else {
    if (selectedIcon) {
      selectedIcon.classList.remove("selected");
    }
    icon.classList.add("selected");
    selectedIcon = icon;
  }
}

function dragElement(element) {
  var initialX = 0;
  var initialY = 0;
  var currentX = 0;
  var currentY = 0;

  if (document.getElementById(element.id + "-header")) {
    document.getElementById(element.id + "-header").onmousedown = startDragging;
  } else {
    element.onmousedown = startDragging;
  }

  function startDragging(e) {
    e = e || window.event;
    e.preventDefault();
    initialX = e.clientX;
    initialY = e.clientY;
    document.onmouseup = stopDragging;
    document.onmousemove = dragElement;
    element.classList.add("dragged");
  }

  function dragElement(e) {
    e = e || window.event;
    e.preventDefault();
    currentX = initialX - e.clientX;
    currentY = initialY - e.clientY;
    initialX = e.clientX;
    initialY = e.clientY;
    element.style.top = element.offsetTop - currentY + "px";
    element.style.left = element.offsetLeft - currentX + "px";
  }

  function stopDragging() {
    document.onmouseup = null;
    document.onmousemove = null;
    element.classList.remove("dragged");
  }
}
function closeWindow(element) {
  element.style.display = "none";
}

var topIdx = 1;
var topBar = document.querySelector("#top");

function openWindow(element) {
  element.style.display = "flex";
  topIdx++;
  element.style.zIndex = topIdx;
  topBar.style.zIndex = topIdx + 1;

  element.style.left = (window.innerWidth - element.offsetWidth) / 2 + "px";
  element.style.top = (window.innerHeight - element.offsetHeight) / 2 + "px";

  if (element.id === "calc-win") {
    display.focus();
  }

  if (element.id === "note-win") {
    document.getElementById("note-textarea").focus();
  }
}

function handleWindowTap(element) {
  topIdx++;
  element.style.zIndex = topIdx;
  topBar.style.zIndex = topIdx + 1;

  if (element.id === "calc-win") {
    display.focus();
  }
}

var selectedIcon = undefined;

function windowInit(appName) {
  var appWin = document.querySelector("#" + appName + "-win");
  var appWinClose = document.querySelector("#" + appName + "-close-btn");
  var appIcon = document.querySelector("#" + appName + "-btn");

  dragElement(appWin);
  if (appName != "wellcome") {
    appIcon.addEventListener("click", () => handleIconTap(appIcon, appWin));
  }
  appWinClose.addEventListener("click", () => closeWindow(appWin));
  appWin.addEventListener("mousedown", () => handleWindowTap(appWin));
}
windowInit("wellcome");
openWindow(document.getElementById("wellcome-win"));
windowInit("calc");
windowInit("note");
windowInit("timer");
windowInit("settings");

var display = document.getElementById("calc-input");

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName;
  const isTextInput = tag === "TEXTAREA" || tag === "INPUT";

  if (e.key === "Backspace") {
    if (isTextInput) return;
    e.preventDefault();
  }
  if (document.activeElement !== display) return;

  var key = e.key;

  if ("0123456789.+-*/()".includes(key)) {
    e.preventDefault();
    display.value += key;
  } else if (key === "Enter") {
    e.preventDefault();
    calculate();
  } else if (key === "Backspace") {
    e.preventDefault();
    display.value = display.value.slice(0, -1);
  } else if (key === "Escape") {
    e.preventDefault();
    display.value = "";
  }
});

function calculate() {
  try {
    display.value = Function('"use strict"; return (' + display.value + ")")();
  } catch {
    display.value = "ERROR";
  }
}

var numpadContainer = document.getElementById("calc-numpad");
var numpad = numpadContainer.querySelectorAll(".num-btn");
var input = document.getElementById("calc-input");

function writeInput(idx) {
  switch (idx) {
    case 0:
      input.value += "9";
      break;
    case 1:
      input.value += "8";
      break;
    case 2:
      input.value += "7";
      break;
    case 3:
      input.value += "+";
      break;
    case 4:
      input.value = "";
      break;
    case 5:
      input.value += "6";
      break;
    case 6:
      input.value += "5";
      break;
    case 7:
      input.value += "4";
      break;
    case 8:
      input.value += "-";
      break;
    case 9:
      input.value = input.value.slice(0, -1);
      break;
    case 10:
      input.value += "3";
      break;
    case 11:
      input.value += "2";
      break;
    case 12:
      input.value += "1";
      break;
    case 13:
      input.value += "*";
      break;
    case 14:
      calculate();
      break;
    case 15:
      input.value += "0";
      break;
    case 16:
      input.value += "00";
      break;
    case 17:
      input.value += ".";
      break;
    case 18:
      input.value += "/";
      break;
    default:
      break;
  }
}

for (var i = 0; i < numpad.length; i++) {
  numpad[i].addEventListener(
    "click",
    (function (idx) {
      return function () {
        writeInput(idx);
      };
    })(i),
  );
}

var ALARM_MAX_SECONDS = 30;

function alarmTone(ctx, out, o) {
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  var attack = o.attack || 0.01;
  var peak = o.peak || 0.5;

  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(o.freq, o.t);
  if (o.sweep) {
    for (var i = 0; i < o.sweep.length; i++) {
      osc.frequency.linearRampToValueAtTime(o.sweep[i][1], o.t + o.sweep[i][0]);
    }
  }

  var release = o.sustain ? Math.min(0.03, o.dur / 2) : o.dur - attack;
  var holdEnd = o.t + o.dur - release;
  gain.gain.setValueAtTime(0.0001, o.t);
  gain.gain.linearRampToValueAtTime(peak, o.t + attack);
  if (holdEnd > o.t + attack) gain.gain.setValueAtTime(peak, holdEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);

  osc.connect(gain);
  gain.connect(out);
  osc.start(o.t);
  osc.stop(o.t + o.dur + 0.05);
}

var ALARM_SOUNDS = {
  beep: {
    cycle: 1.4,
    play: function (ctx, out, t) {
      for (var i = 0; i < 3; i++) {
        alarmTone(ctx, out, {
          type: "triangle",
          freq: 1000,
          t: t + i * 0.22,
          dur: 0.14,
          peak: 0.6,
          sustain: true,
        });
      }
    },
  },
  chime: {
    cycle: 2.4,
    play: function (ctx, out, t) {
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        var start = t + i * 0.16;
        alarmTone(ctx, out, { freq: notes[i], t: start, dur: 1.8, peak: 0.35 });
        alarmTone(ctx, out, {
          freq: notes[i] * 2,
          t: start,
          dur: 0.8,
          peak: 0.08,
        });
      }
    },
  },
  bell: {
    cycle: 3.2,
    play: function (ctx, out, t) {
      var ratios = [1, 2, 2.76, 5.4, 8.93];
      var peaks = [0.4, 0.2, 0.15, 0.08, 0.04];
      for (var strike = 0; strike < 2; strike++) {
        for (var i = 0; i < ratios.length; i++) {
          alarmTone(ctx, out, {
            freq: 520 * ratios[i],
            t: t + strike * 1.2,
            dur: 3.0 / (1 + i * 0.6),
            peak: peaks[i],
            attack: 0.004,
          });
        }
      }
    },
  },
  digital: {
    cycle: 1.0,
    play: function (ctx, out, t) {
      for (var i = 0; i < 4; i++) {
        alarmTone(ctx, out, {
          type: "square",
          freq: 1760,
          t: t + i * 0.12,
          dur: 0.07,
          peak: 0.25,
          sustain: true,
        });
      }
    },
  },
  siren: {
    cycle: 2.6,
    play: function (ctx, out, t) {
      alarmTone(ctx, out, {
        type: "sawtooth",
        freq: 600,
        sweep: [
          [0.5, 1000],
          [1.0, 600],
          [1.5, 1000],
          [2.0, 600],
        ],
        t: t,
        dur: 2.0,
        peak: 0.2,
        sustain: true,
      });
    },
  },
};

var alarm = (function () {
  var ctx = null;
  var master = null;
  var current = null;
  var endTimeout = null;
  var volume = 0.7;
  var soundId = "beep";

  function ensureContext() {
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state !== "running") {
      var resumed = ctx.resume();
      if (resumed && resumed.catch) resumed.catch(function () {});
    }
    return ctx;
  }

  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v));
    if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.01);
  }

  function setSound(id) {
    if (ALARM_SOUNDS[id]) soundId = id;
  }

  function stop() {
    clearTimeout(endTimeout);
    endTimeout = null;
    if (current && ctx) {
      var bus = current;
      current = null;
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(function () {
        bus.disconnect();
      }, 300);
    }
  }

  function play(opts) {
    var c = ensureContext();
    if (!c) return;
    stop();

    var def = ALARM_SOUNDS[soundId];
    var cycles =
      opts && opts.once
        ? 1
        : Math.max(1, Math.floor(ALARM_MAX_SECONDS / def.cycle));
    var bus = c.createGain();
    bus.connect(master);

    var t0 = c.currentTime + 0.05;
    for (var i = 0; i < cycles; i++) {
      def.play(c, bus, t0 + i * def.cycle);
    }

    current = bus;
    endTimeout = setTimeout(stop, (cycles * def.cycle + 3) * 1000);
  }

  return {
    unlock: ensureContext,
    play: play,
    stop: stop,
    setVolume: setVolume,
    setSound: setSound,
  };
})();

function createTimer(display, onFinish) {
  let remainingMs = 0;
  let endTime = 0;
  let intervalId = null;
  let running = false;

  function formatTime(ms) {
    let totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    let m = Math.floor(totalSeconds / 60);
    let s = totalSeconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function tick() {
    let left = endTime - Date.now();
    let finished = left <= 0;
    if (finished) {
      left = 0;
      pause();
    }
    display.textContent = formatTime(left);
    remainingMs = left;
    if (finished && onFinish) onFinish();
  }

  function start(durationSeconds) {
    if (durationSeconds !== undefined) {
      remainingMs = durationSeconds * 1000;
    }
    endTime = Date.now() + remainingMs;
    running = true;
    intervalId = setInterval(tick, 250);
    tick();
  }

  function pause() {
    clearInterval(intervalId);
    running = false;
  }

  function reset(durationSeconds) {
    pause();
    remainingMs = durationSeconds * 1000;
    display.textContent = formatTime(remainingMs);
  }

  return { start, pause, reset, isRunning: () => running };
}

var timerDisplay = document.getElementById("timer-display");
var timer = createTimer(timerDisplay, () => alarm.play());
var timerSlider = document.getElementById("timer-slider");

function getSliderSeconds() {
  return parseInt(timerSlider.value, 10) * 60;
}

timer.reset(getSliderSeconds());

timerSlider.addEventListener("input", () => {
  alarm.stop();
  if (!timer.isRunning()) {
    timer.reset(getSliderSeconds());
  }
});

document.getElementById("timer-start-btn").addEventListener("click", () => {
  alarm.stop();
  alarm.unlock();
  if (!timer.isRunning()) timer.start(getSliderSeconds());
});

document.getElementById("timer-pause-btn").addEventListener("click", () => {
  alarm.stop();
  timer.pause();
});
document.getElementById("timer-reset-btn").addEventListener("click", () => {
  alarm.stop();
  timer.reset(getSliderSeconds());
});

var soundSelect = document.getElementById("settings-sound-select");
var volumeSlider = document.getElementById("settings-volume-slider");
var volumeValueLabel = document.getElementById("settings-volume-value");

alarm.setSound(soundSelect.value);
alarm.setVolume(parseInt(volumeSlider.value, 10) / 100);

soundSelect.addEventListener("change", () => alarm.setSound(soundSelect.value));

volumeSlider.addEventListener("input", () => {
  var percent = parseInt(volumeSlider.value, 10);
  volumeValueLabel.textContent = percent + "%";
  alarm.setVolume(percent / 100);
});

document
  .getElementById("settings-sound-test-btn")
  .addEventListener("click", () => alarm.play({ once: true }));

function refreshTime() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
}

refreshTime();
setInterval(refreshTime, 1000);

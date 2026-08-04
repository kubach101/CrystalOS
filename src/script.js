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
        element.style.top = (element.offsetTop - currentY) + "px";
        element.style.left = (element.offsetLeft - currentX) + "px";
    }

    function stopDragging() {
        document.onmouseup = null;
        document.onmousemove = null;
        element.classList.remove("dragged");
    }
}
function closeWindow(element) {
    element.style.display = "none"
}

var topIdx = 1;
var topBar = document.querySelector("#top");

function openWindow(element) {
    element.style.display = "flex";
    topIdx++;
    element.style.zIndex = topIdx;
    topBar.style.zIndex = topIdx + 1;

    element.style.left = ((window.innerWidth - element.offsetWidth) / 2) + "px";
    element.style.top = ((window.innerHeight - element.offsetHeight) / 2) + "px";

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

var selectedIcon = undefined

function handleIconTap(icon, window) {
    if (icon.classList.contains("selected")) {
        icon.classList.remove("selected");
        selectedIcon = undefined;
        openWindow(window);
    } else {
        if (selectedIcon) {
            selectedIcon.classList.remove("selected");
        }
        icon.classList.add("selected");
        selectedIcon = icon;
    }
}

function windowInit(appName) {
    var appWin = document.querySelector("#" + appName + "-win");
    var appWinClose = document.querySelector("#" + appName + "-close-btn");
    var appIcon = document.querySelector("#" + appName + "-btn");

    dragElement(appWin)
    if (appName != "wellcome") { appIcon.addEventListener("click", () => handleIconTap(appIcon, appWin)); }
    appWinClose.addEventListener("click", () => closeWindow(appWin));
    appWin.addEventListener("mousedown", () => handleWindowTap(appWin));
}

windowInit("wellcome")
openWindow(document.getElementById("wellcome-win"))
windowInit("calc")
windowInit("note")
windowInit("timer")
windowInit("settings")

var display = document.getElementById("calc-input");

document.addEventListener("keydown", (e) => {
    const tag = document.activeElement.tagName;
    const isTextInput = tag === 'TEXTAREA' || tag === 'INPUT';

    if (e.key === 'Backspace') {
        if (isTextInput) return;
        e.preventDefault();
    }
    if (document.activeElement !== display) return;

    var key = e.key;

    if ("0123456789.+-*/()".includes(key)) {
        e.preventDefault();
        display.value += key;
    }
    else if (key === "Enter") {
        e.preventDefault();
        calculate();
    }
    else if (key === "Backspace") {
        e.preventDefault();
        display.value = display.value.slice(0, -1);
    }
    else if (key === "Escape") {
        e.preventDefault();
        display.value = "";
    }
});

function calculate() {
    try {
        display.value = Function('"use strict"; return (' + display.value + ')')();
    } catch {
        display.value = "ERROR";
    }
}

var numpadContainer = document.getElementById("calc-numpad");
var numpad = numpadContainer.querySelectorAll(".num-btn");
var input = document.getElementById('calc-input');

function writeInput(idx) {
    switch (idx) {
        case 0:
            input.value += '9';
            break;
        case 1:
            input.value += '8';
            break;
        case 2:
            input.value += '7';
            break;
        case 3:
            input.value += '+';
            break;
        case 4:
            input.value = "";
            break;
        case 5:
            input.value += '6';
            break;
        case 6:
            input.value += '5';
            break;
        case 7:
            input.value += '4';
            break;
        case 8:
            input.value += '-';
            break;
        case 9:
            input.value = input.value.slice(0, -1);
            break;
        case 10:
            input.value += '3';
            break;
        case 11:
            input.value += '2';
            break;
        case 12:
            input.value += '1';
            break;
        case 13:
            input.value += '*';
            break;
        case 14:
            calculate();
            break;
        case 15:
            input.value += '0';
            break;
        case 16:
            input.value += "00";
            break;
        case 17:
            input.value += '.';
            break;
        case 18:
            input.value += '/';
            break;
        default:
            break;
    }
}


for (var i = 0; i < numpad.length; i++) {
    numpad[i].addEventListener("click", (function (idx) {
        return function () {
            writeInput(idx);
        };
    })(i));
}



function createTimer(display) {
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
        if (left <= 0) {
            left = 0;
            pause();
        }
        display.textContent = formatTime(left);
        remainingMs = left;
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
var timer = createTimer(timerDisplay);
var timerSlider = document.getElementById("timer-slider");

function getSliderSeconds() {
    return parseInt(timerSlider.value, 10) * 60;
}

timer.reset(getSliderSeconds());

timerSlider.addEventListener("input", () => {
    if (!timer.isRunning()) {
        timer.reset(getSliderSeconds());
    }
});

document.getElementById("timer-start-btn").addEventListener("click", () => {
    if (!timer.isRunning()) timer.start(getSliderSeconds());
})

document.getElementById("timer-pause-btn").addEventListener("click", () => timer.pause());
document.getElementById("timer-reset-btn").addEventListener("click", () => timer.reset(getSliderSeconds()));
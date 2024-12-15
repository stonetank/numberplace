/*
 * Copyright 2024 StoneTank
 * Licensed under the MIT License
 * https://opensource.org/license/mit
 */

/**
 * 全セル数字配列
 * @type {Array<Number>}
 */
let numbers = [];

/**
 * 全セルそれぞれの固定状態
 * @type {Array<Boolean>}
 */
let fixes = [];

/**
 * どのセルがアクティブか。非アクティブの場合 -1
 * @type {Number}
 */
let pointer = -1;

/**
 * 編集済みフラグ
 * @type {Boolean}
 */
let isDirty = false;

/**
 * 元に戻す用 numbers の履歴
 * @type {Array<Array<Number>>}
 */
let numbersHistory = [];

// イベントリスナ登録
window.addEventListener("load", () => {
    window.addEventListener("beforeunload", onBeforeunloadWindow);
    window.addEventListener("resize", onResizeWindow);

    document.querySelectorAll(".start-button").forEach((e) => {
        e.addEventListener("click", onClickStartButton);
    });

    document.getElementById("game-screen").addEventListener("click", onClickGameScreen);
    document.getElementById("game-screen").addEventListener("keydown", onKeydownGameScreen);

    document.querySelectorAll(".cell").forEach((e) => {
        e.addEventListener("click", onClickCell);
    });

    document.querySelectorAll(".number-button").forEach((e) => {
        e.addEventListener("click", onClickNumberButton);
    });

    document.getElementById("note-checkbox").addEventListener("click", onClickNoteCheckbox);
    document.getElementById("note-checkbox-label").addEventListener("click", onClickNoteCheckbox);
    document.getElementById("undo-button").addEventListener("click", onClickUndoButton);
    document.getElementById("reset-button").addEventListener("click", onClickResetButton);
    document.getElementById("delete-button").addEventListener("click", onClickDeleteButton);
    document.getElementById("new-button").addEventListener("click", onClickNewButton);

    initialize();
});

/**
 * 初期処理
 */
function initialize() {
    const spell = new URL(document.location).searchParams.get("s");

    if (spell === null || !/^[0-9a-z]{54}$/.test(spell)) {
        document.getElementById("start-screen").style.display = "block";
    }
    else {
        numbers = decodeSpell(spell);
        fixes = [];
        pointer = -1;
        isDirty = false;
        numbersHistory = [];

        for (let i = 0; i < 81; i++) {
            fixes[i] = numbers[i] > 0;
        }

        document.getElementById("game-screen").style.display = "block";
        document.getElementById("note-checkbox").checked = false;

        refresh();
        onResizeWindow();
    }
}

/**
 * ポインタを移動する
 * @param {Number} diff いくつ移動するか
 */
function movePointer(diff) {
    if (pointer < 0) {
        return;
    }

    let newIndex = pointer + diff;
    if (newIndex > 80) {
        newIndex = newIndex - 81;
    }
    else if (newIndex < 0) {
        newIndex = newIndex + 81;
    }

    pointer = newIndex;
}

/**
 * 表示を最新の状態に更新する。
 */
function refresh() {
    /**
     * 全セルが埋まっているか
     * @type {Boolean}
     */
    let isAllCellAreFilled = true;

    /**
     * 数字ごとの使用済み数
     */
    const numberCountList = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
    };
    
    for (let i = 0; i < 81; i++) {
        const element = document.getElementById(`cell${i}`);

        if (numbers[i] < 1 || numbers[i] > 9) {
            isAllCellAreFilled = false;
        }
        
        if (numbers[i] > 9) {
            // メモ
            const note9 = (numbers[i] & 4096) === 4096 ? "9" : "&nbsp;";
            const note8 = (numbers[i] & 2048) === 2048 ? "8" : "&nbsp;";
            const note7 = (numbers[i] & 1024) === 1024 ? "7" : "&nbsp;";
            const note6 = (numbers[i] & 512) === 512 ? "6" : "&nbsp;";
            const note5 = (numbers[i] & 256) === 256 ? "5" : "&nbsp;";
            const note4 = (numbers[i] & 128) === 128 ? "4" : "&nbsp;";
            const note3 = (numbers[i] & 64) === 64 ? "3" : "&nbsp;";
            const note2 = (numbers[i] & 32) === 32 ? "2" : "&nbsp;";
            const note1 = (numbers[i] & 16) === 16 ? "1" : "&nbsp;";
            element.innerHTML =
                `<table class="notes"><tr><td>${note1}</td><td>${note2}</td><td>${note3}</td></tr>` +
                `<tr><td>${note4}</td><td>${note5}</td><td>${note6}</td></tr>` +
                `<tr><td>${note7}</td><td>${note8}</td><td>${note9}</td></tr></table>`;
        }
        else if (numbers[i] > 0) {
            // 確定数
            element.innerText = numbers[i].toString();

            numberCountList[numbers[i]]++;
        }
        else {
            element.innerText = "";
        }

        if (fixes[i]) {
            element.classList.add("fixed");
        }
        else {
            element.classList.remove("fixed");
        }

        if (i === pointer) {
            element.classList.add("active");
        }
        else {
            element.classList.remove("active");
        }

        if (
            pointer >= 0 &&
            numbers[pointer] > 0 &&
            numbers[pointer] <= 9 &&
            numbers[pointer] === numbers[i]
        ) {
            element.classList.add("bold");
        }
        else {
            element.classList.remove("bold");
        }
    }
    
    // 使用済みの数を判定
    for (let i = 1; i < 10; i++) {
        if (numberCountList[i] >= 9) {
            document.querySelector(`.number-button[value="${i}"]`).setAttribute("disabled", "");
        }
        else {
            document.querySelector(`.number-button[value="${i}"]`).removeAttribute("disabled");
        }
    }

    // 解けたか判定
    if (isAllCellAreFilled && validate(numbers)) {
        document.querySelectorAll(".cell").forEach((e) => {
            e.classList.add("solved");
        });
        document.getElementById("status").innerText = "正しい配置です。";
    }
    else {
        document.querySelectorAll(".cell").forEach((e) => {
            e.classList.remove("solved");
        });
        document.getElementById("status").innerText =
            isAllCellAreFilled
            ? "間違っている箇所があります。"
            : "\xA0";
    }
}

/**
 * 指定セルの値をセットする。
 * @param {Number} index 対象セルインデックス
 * @param {Number} value 値(0 - 9)
 */
function setValue(index, value) {
    if (fixes[index] || value < 0 || value > 9) {
        return;
    }

    isDirty = true;
    appendHistory();

    numbers[index] = value;

    if (value === 0) return;

    const flag = 2 ** (value + 3);

    // メモ削除 - 行
    let startIndex = Math.floor(index / 9) * 9;
    for (let i = 0; i < 9; i++) {
       numbers[startIndex + i] = numbers[startIndex + i] & (~flag);
    }

    // メモ削除 - 列
    startIndex = index % 9;
    for (let i = 0; i < 9; i++) {
        numbers[startIndex + i * 9] = numbers[startIndex + i * 9] & (~flag);
    }

    // メモ削除 - 窓
    const r = Math.floor(index / 27) * 27; // 窓の行開始位置
    const c = Math.floor(index % 9 / 3) * 3; //窓の列開始位置
    startIndex = r + c;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            numbers[startIndex + i * 9 + j] = numbers[startIndex + i * 9 + j] & (~flag);
        }
    }
}

/**
 * 指定セルのメモをセットする。すでに同じ数字のメモがあれば削除する。
 * @param {Number} index 対象セルインデックス
 * @param {Number} value 値(1 - 9)
 */
function addOrRemoveNote(index, value) {
    if (fixes[index]|| value < 1 || value > 9) {
        return;
    }

    isDirty = true;
    appendHistory();
    
    const flag = 2 ** (value + 3);
    if ((numbers[index] & flag) === flag) {
        // 削除
        numbers[index] = numbers[index] & (~flag);
    }
    else {
        // 追加 (下位4ビット＝確定数字は削除)
        numbers[index] = numbers[index] & 8176 | flag;
    }
}

/**
 * setValue と addOrRemoveNote のラッパー
 * @param {Number} value 値(0 - 9)
 */
function inputValue(value) {
    if (pointer < 0) {
        return;
    }
    if (document.getElementById("note-checkbox").checked) {
        addOrRemoveNote(pointer, value);
    }
    else {
        setValue(pointer, value);
    }
}

/**
 * 元に戻す用履歴を作成する
 */
function appendHistory() {
    const index = numbersHistory.push([]) - 1;
    for (let i = 0; i < 81; i++) {
        numbersHistory[index][i] = numbers[i];
    }
}

/**
 * 元に戻す
 */
function undo() {
    if (numbersHistory.length === 0) {
        return;
    }
    const last = numbersHistory[numbersHistory.length - 1];

    for (let i = 0; i < 81; i++) {
        numbers[i] = last[i];
    }

    numbersHistory.pop();
}

/**
 * すべて元に戻す
 */
function reset() {
    if (numbersHistory.length === 0) {
        return;
    }
    const first = numbersHistory[0];

    for (let i = 0; i < 81; i++) {
        numbers[i] = first[i];
    }

    numbersHistory = [];
}

/**
 * 画面離脱時の処理
 * @param {Event} event 
 */
function onBeforeunloadWindow(event) {
    if (isDirty) {
        event.preventDefault();
    }
}

/**
 * 画面サイズ変動時に文字サイズの調整を行う
 */
function onResizeWindow() {
    const targetFontSizePx = document.getElementById("cell0").clientWidth * 0.65;
    document.getElementById("board").style.fontSize = `${targetFontSizePx}px`;
}

/**
 * スタートボタン押下時の処理
 * @param {Event} event
 */
function onClickStartButton(event) {
    const difficulty = event.target.dataset.difficulty;
    if (
        difficulty !== "1" &&
        difficulty !== "2" &&
        difficulty !== "3"
    ) {
        return;
    }
    
    document.getElementById("start-screen").innerHTML =
        "<div class='flex justify-content-center'><div class='loading'></div></div>";

    setTimeout(() => {
        const targetBlankCount = (Number(difficulty) - 1) * 7 + 43;

        try {
            const spell = encodeSpell(generate(targetBlankCount));
            window.location.replace(`?s=${spell}`);
        }
        catch {
            window.alert("エラーが発生しました。再度お試しください。");
            window.location.replace("?");
        }
    }, 0);
}

/**
 * 背景押下時に選択を解除する。
 */
function onClickGameScreen() {
    pointer = -1;
    refresh();
}

/**
 * キー押下時の処理
 * @param {KeyboardEvent} event
 */
function onKeydownGameScreen(event) {
    if (event.ctrlKey && event.key === "z") {
        undo();
    }
    else {
        switch (event.key) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                inputValue(Number(event.key));
                break;
            case "Delete":
            case "Backspace":
                inputValue(0);
                break;
            case "ArrowDown":
                movePointer(9);
                break;
            case "ArrowUp":
                movePointer(-9);
                break;
            case "ArrowLeft":
                movePointer(-1);
                break;
            case "ArrowRight":
                movePointer(1);
                break;
        }
    }
    refresh();
}

/**
 * セルクリック時の処理
 * @param {Event} event
 */
function onClickCell(event) {
    event.stopPropagation();
    pointer = Number(event.currentTarget.id.slice(4));
    refresh();
}

/**
 * 数字ボタン押下時の処理
 * @param {Event} event
 */
function onClickNumberButton(event) {
    event.stopPropagation();

    const value = Number(event.target.value);
    inputValue(value);

    refresh();
}

/**
 * メモチェックボックス押下時の処理
 * @param {Event} event
 */
function onClickNoteCheckbox(event)  {
    event.stopPropagation();
}

/**
 * 元に戻すボタン押下時の処理
 * @param {Event} event
 */
function onClickUndoButton(event) {
    event.stopPropagation();
    undo();
    refresh();
}

/**
 * リセットボタン押下時の処理
 * @param {Event} event
 */
function onClickResetButton(event) {
    event.stopPropagation();
    if (window.confirm("すべて元に戻してよろしいですか?")) {
        reset();
        refresh();
    }
}

/**
 * 削除ボタン押下時の処理
 * @param {Event} event
 */
function onClickDeleteButton(event) {
    event.stopPropagation();
    if (pointer < 0) {
        return;
    }
    setValue(pointer, 0);
    refresh();
}

/**
 * 新規ボタン押下時の処理
 * @param {Event} event
 */
function onClickNewButton(event) {
    event.stopPropagation();
    window.location.href = "?";
}
/*
 * Copyright 2024 StoneTank
 * Licensed under the MIT License
 * https://opensource.org/license/mit
 */

/**
 * 保存用文字列をデコードする
 * @param {string} spell 保存用文字列
 * @returns {Array<Number>} 全セル数値配列
 */
function decodeSpell(spell) {
    /**
     * @type {Array<Number>} 結果の配列
     */
    const numbers = [];

    for (let i = 0; i < 9; i++) {
        /**
         * 当該行の数値の36進表現
         * @type {string}
         */
        const base36 = spell.substring(6 * i, 6 * i + 6);
        /**
         * 当該行の数値(10進)
         * @type {number}
         */
        const decimal = parseInt(base36, 36);
        /**
         * 当該行の数値(10進)(ゼロ埋め)
         * @type {string}
         */
        const rowStr = decimal.toString().padStart(9, "0");

        for (let j = 0; j < 9; j++) {
            const index = 9 * i + j;
            numbers[index] = Number(rowStr[j]);
        }
    }

    return numbers;
}

/**
 * 保存用文字列にエンコードする
 * @param {Array<Number>} numbers 全セル数値配列
 * @returns {string} 保存用文字列
 */
function encodeSpell(numbers) {
    /**
     * 結果の文字列
     * @type {string}
     */
    let result = "";

    for (let i = 0; i < 9; i++) {
        /**
         * 当該行の数値(10進)(ゼロ埋め)
         * @type {string}
         */
        let rowStr = "";
        for (let j = 0; j < 9; j++) {
            let number = numbers[9 * i + j];
            if (number < 0 || number > 9) {
                number = 0;
            }
            rowStr += number.toString();
        }
        /**
         * 当該行の数値(10進)
         * @type {number}
         */
        const decimal = parseInt(rowStr, 10);
        /**
         * 当該行の数値の36進表現(ゼロ埋め)
         * @type {string}
         */
        const base36 = decimal.toString(36).padStart(6, "0");

        result += base36;
    }

    return result;
}

/**
 * 現在のセルの同一行内にある数値の配列を取得する。
 * @param {Array<Number>} numbers 全セル数値配列
 * @param {Number} currentIndex 現在のセルのインデックス
 * @returns {Array<Number>} 現在のセルの同一行内にある数値の配列
 */
function getRowNumbers(numbers, currentIndex) {
    /**
     * 行の開始インデックス
     * @type {Number}
     */
    const startIndex = Math.floor(currentIndex / 9) * 9;
    /**
     * 結果の配列
     * @type {Array<Number>}
     */
    const result = [];

    for (let i = 0; i < 9; i++) {
        const number = numbers[startIndex + i];

        if (number === undefined || number === 0 || result.includes(number)) {
            continue;
        }

        result.push(number);
    }

    return result.sort();
}

/**
 * 現在のセルの同一列内にある数値の配列を取得する。
 * @param {Array<Number>} numbers 全セル数値配列
 * @param {Number} currentIndex 現在のセルのインデックス
 * @returns {Array<Number>} 現在のセルの同一列内にある数値の配列
 */
function getColumnNumbers(numbers, currentIndex) {
    /**
     * 列の開始インデックス
     * @type {Number}
     */
    const startIndex = currentIndex % 9;
    /**
     * 結果の配列
     * @type {Array<Number>}
     */
    const result = [];

    for (let i = 0; i < 9; i++) {
        const number = numbers[startIndex + i * 9];

        if (number === undefined || number === 0 || result.includes(number)) {
            continue;
        }

        result.push(number);
    }

    return result.sort();
}

/**
 * 現在のセルの同一窓内にある数値の配列を取得する。
 * @param {Array<Number>} numbers 全セル数値配列
 * @param {Number} currentIndex 現在のセルのインデックス
 * @returns {Array<Number>} 現在のセルの同一窓内にある数値の配列
 */
function getWindowNumbers(numbers, currentIndex) {
    /**
     * 現在の窓の行開始位置
     * @type {Number}
     */
    const r = Math.floor(currentIndex / 27) * 27;
    /**
     * 現在の窓の列開始位置
     * @type {Number}
     */
    const c = Math.floor(currentIndex % 9 / 3) * 3;
    /**
     * 現在の窓開始位置
     * @type {Number}
     */
    const startIndex = r + c;
    /**
     * 結果の配列
     * @type {Array<Number>}
     */
    const result = [];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const number = numbers[startIndex + i * 9 + j];

            if (number === undefined || number === 0 || result.includes(number)) {
                continue;
            }

            result.push(number);
        }
    }

    return result.sort();
}

/**
 * 現在のセルに入力可能な数値の配列を取得する。
 * @param {Array<Number>} numbers 全セル数値配列
 * @param {Number} currentIndex 現在のセルのインデックス
 * @returns {Array<Number>} 現在のセルに入力可能な数値の配列
 */
function getChoices(numbers, currentIndex) {
    // すでに入力済みの場合は入力可能な数値なしとする
    if (numbers[currentIndex] > 0 && numbers[currentIndex] <= 9) {
        return [];
    }

    /**
     * 結果の配列
     * @type {Array<Number>}
     */
    const result = [];

    const rowNumbers = getRowNumbers(numbers, currentIndex);
    const columnNumbers = getColumnNumbers(numbers, currentIndex);
    const windowNumbers = getWindowNumbers(numbers, currentIndex);

    for (let i = 1; i < 10; i++) {
        if (rowNumbers.includes(i)) continue;
        if (columnNumbers.includes(i)) continue;
        if (windowNumbers.includes(i)) continue;

        result.push(i);
    }

    return result;
}

/**
 * 解決を試みる。
 * @param {Array<Number>} numbers 全セル数値配列
 */
function solve(numbers) {
    /**
     * 結果の配列
     * @type {Array<Number>}
     */
    const result = [];

    // result に numbers をコピーしておく
    for (let i = 0; i < 81; i++) {
        result[i] = numbers[i];
    }

    /**
     * ループ制御用変数
     * @type {Boolean}
     */
    let loop = false;

    do {
        loop = false;

        // (1) 入力可能数値が1つしかない場合は適用
        for (let i = 0; i < 81; i++) {
            const choices = getChoices(i);
            if (choices.length === 1) {
                result[i] = choices[0];
                loop = true;
            }
        }

        /**
         * 現時点での入力可能数値を記録する
         * @type {Array<Array<Number>>}
         */
        const choicesList = [];
        for (let i = 0; i < 81; i++) {
            choicesList.push(getChoices(result, i));
        }

        // (2) 各窓の各行・列において、
        // 「この3セルのいずれかには必ずnが入る」場合を検出し、
        // 延長線上の行・列の入力可能数値からnを除外する
        [0, 3, 6, 27, 30, 33, 54, 57, 60].forEach((i) => {
            // i は各窓の開始インデックス

            for (let j = 1; j < 10; j++) {
                const row1 = // 窓内1行目にjが入りうるもしくは入っているかどうか
                    getChoices(result, i).includes(j) ||
                    getChoices(result, i + 1).includes(j) ||
                    getChoices(result, i + 2).includes(j) ||
                    result[i] === j ||
                    result[i + 1] === j ||
                    result[i + 2] === j;
                const row2 = // 窓内2行目にjが入りうるもしくは入っているかどうか
                    getChoices(result, i + 9).includes(j) ||
                    getChoices(result, i + 10).includes(j) ||
                    getChoices(result, i + 11).includes(j) ||
                    result[i + 9] === j ||
                    result[i + 10] === j ||
                    result[i + 11] === j;
                const row3 = // 窓内3行目にjが入りうるもしくは入っているかどうか
                    getChoices(result, i + 18).includes(j) ||
                    getChoices(result, i + 19).includes(j) ||
                    getChoices(result, i + 20).includes(j) ||
                    result[i + 18] === j ||
                    result[i + 19] === j ||
                    result[i + 20] === j;
                if (row1 && !row2 && !row3) { // 窓内1行目に必ずjが入る
                    for (let k = 0; k < 9; k++) {
                        if (k >= i % 9 && k < i % 9 + 3) continue; // 窓内は無視
                        const index = Math.floor(i / 9) * 9 + k;
                        choicesList[index] = choicesList[index].filter(s => s !== j);
                    }
                }
                if (!row1 && row2 && !row3) { // 窓内2行目に必ずjが入る
                    for (let k = 0; k < 9; k++) {
                        if (k >= i % 9 && k < i % 9 + 3) continue; // 窓内は無視
                        const index = Math.floor(i / 9) * 9 + k + 9;
                        choicesList[index] = choicesList[index].filter(s => s !== j);
                    }
                }
                if (!row1 && !row2 && row3) { // 窓内3行目に必ずjが入る
                    for (let k = 0; k < 9; k++) {
                        if (k >= i % 9 && k < i % 9 + 3) continue; // 窓内は無視
                        const index = Math.floor(i / 9) * 9 + k + 18;
                        choicesList[index] = choicesList[index].filter(s => s !== j);
                    }
                }

                const col1 = // 窓内1列目にjが入りうるもしくは入っているかどうか
                    getChoices(result, i).includes(j) ||
                    getChoices(result, i + 9).includes(j) ||
                    getChoices(result, i + 18).includes(j) ||
                    result[i] === j ||
                    result[i + 9] === j ||
                    result[i + 18] === j;
                const col2 = // 窓内2列目にjが入りうるもしくは入っているかどうか
                    getChoices(result, i + 1).includes(j) ||
                    getChoices(result, i + 10).includes(j) ||
                    getChoices(result, i + 19).includes(j) ||
                    result[i + 1] === j ||
                    result[i + 10] === j ||
                    result[i + 19] === j;
                const col3 = // 窓内3列目にjが入りうるもしくは入っているかどうか
                    getChoices(result, i + 2).includes(j) ||
                    getChoices(result, i + 11).includes(j) ||
                    getChoices(result, i + 20).includes(j) ||
                    result[i + 2] === j ||
                    result[i + 11] === j ||
                    result[i + 20] === j;
                if (col1 && !col2 && !col3) { // 窓内1列目に必ずjが入る
                    for (let k = 0; k < 9; k++) {
                        if (k >= Math.floor(i / 9) && k < Math.floor(i / 9) + 3) continue; // 窓内は無視
                        const index = i % 9 + k * 9;
                        choicesList[index] = choicesList[index].filter(s => s !== j);
                    }
                }
                if (!col1 && col2 && !col3) { // 窓内2列目に必ずjが入る
                    for (let k = 0; k < 9; k++) {
                        if (k >= Math.floor(i / 9) && k < Math.floor(i / 9) + 3) continue; // 窓内は無視
                        const index = i % 9 + 1 + k * 9;
                        choicesList[index] = choicesList[index].filter(s => s !== j);
                    }
                }
                if (!col1 && !col2 && col3) { // 窓内3列目に必ずjが入る
                    for (let k = 0; k < 9; k++) {
                        if (k >= Math.floor(i / 9) && k < Math.floor(i / 9) + 3) continue; // 窓内は無視
                        const index = i % 9 + 2 + k * 9;
                        choicesList[index] = choicesList[index].filter(s => s !== j);
                    }
                }
            }
        });

        // (2)の結果として入力可能数値が1つに絞られたセルについて、確定処理を行う
        for (let i = 0; i < 81; i++) {
            if (choicesList[i].length === 1) {
                result[i] = choicesList[i][0];
                loop = true;
            }
        }

        // (3) 各窓内において、ある数字を入力可能なセルが1つしかない場合は適用
        [0, 3, 6, 27, 30, 33, 54, 57, 60].forEach((i) => {
            // i は各窓の開始インデックス

            for (let j = 1; j < 10; j++) {
                const diffs = [0, 1, 2, 9, 10, 11, 18, 19, 20]; // i に足して各セルのインデックスにする

                // 窓内で j が入力可能なセル数をカウントする
                let applyableCount = 0;
                for (let k = 0; k < 9; k++) {
                    if (getChoices(result, i + diffs[k]).includes(j)) {
                        applyableCount++;
                    }
                }

                // 入力可能なセルが1つしかない場合は適用
                if (applyableCount === 1) {
                    for (let k = 0; k < 9; k++) {
                        const index = i + diffs[k];
                        if (getChoices(result, index).includes(j)) {
                            result[index] = j;
                            loop = true;
                        }
                    }
                }
            }
        });

    } while (loop)

    return result;
}

/**
 * ランダムに埋められた全セル数値配列を取得する。
 * @param {Array<Number>} numbers 全セル数値配列
 */
function getCompletedNumbers() {
    /**
     * 結果の配列
     * @type {Array<Number>}
     */
    const result = [
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];

    for (let i = 0; i < 81; i++) {
        const choices = getChoices(result, i);

        // 解けなくなった場合呼び直す
        if (choices.length === 0) {
            return getCompletedNumbers();
        }

        let choiceIndex = Math.floor(Math.random() * choices.length);
        result[i] = choices[choiceIndex];
    }

    return result;
}

/**
 * 作問を行う。
 * @param {Number} targetBlankCount 目標空きセル数
 * @param {Number} recursiveCallCount 再帰的に呼び出した回数(無限ループ阻止用)
 * @returns {Array<Number>} 作成した問題の数値配列
 */
function generate(targetBlankCount, recursiveCallCount = 0) {
    if (recursiveCallCount > 10) {
        throw new Error("再帰呼び出し上限数を超過しました。");
    }

    /**
     * 結果の配列
     * @type {Array<Number>}
     */
    const result = getCompletedNumbers();
    
    let currentBlankCount = 0;
    let loopCount = 0;
    while (currentBlankCount < targetBlankCount) {
        const targetIndex = Math.floor(Math.random() * 81);
        const targetValue = result[targetIndex];

        if (targetValue === 0) continue;

        result[targetIndex] = 0;
        currentBlankCount++;

        if(solve(result).includes(0)) {
            result[targetIndex] = targetValue;
            currentBlankCount--;
        }

        if (loopCount > 200) {
            return generate(targetBlankCount, recursiveCallCount + 1);
        }

        loopCount++;
    }

    console.log("loopCount:", loopCount, "recursiveCallCount:", recursiveCallCount);
    return result;
}

/**
 * 全セルがルールを守るように入力されているか検証する。
 * @param {Array<Number>} numbers 全セル数値配列
 * @returns {Boolean} 検証に成功したかとうか
 */
function validate(numbers) {
    // 行方向
    for (let i = 0; i < 81; i += 9) {
        const rowNumbers = getRowNumbers(numbers, i);
        for (let j = 1; j < 10; j++) {
            if (!rowNumbers.includes(j)) {
                return false;
            }
        }
    }

    // 列方向
    for (let i = 0; i < 9; i++) {
        const columnNumbers = getColumnNumbers(numbers, i);
        for (let j = 1; j < 10; j++) {
            if (!columnNumbers.includes(j)) {
                return false;
            }
        }
    }

    // 窓
    for (let i = 0; i <= 54; i += 27) {
        for (let j = 0; j <= 6; j += 3) {
            // (i + j) が各窓の開始インデックス
            const windowNumbers = getWindowNumbers(numbers, i + j);
            for (let k = 1; k < 10; k++) {
                if (!windowNumbers.includes(k)) {
                    return false;
                }
            }
        }
    }

    return true;
}
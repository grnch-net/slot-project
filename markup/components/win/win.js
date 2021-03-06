import { utils } from 'components/utils/utils';
import { storage } from 'components/storage/storage';
import { events } from 'components/events/events';
import { parameters } from 'components/win/parameters';

import { autoplay } from 'components/autoplay/autoplay';
import { freeSpin } from 'components/freeSpin/freeSpin';

/* eslint-disable no-undef */
/* eslint-disable no-use-before-define */
export let win = (function () {

    const c = createjs;

    let winData = {};
    let stage;
    let winLinesContainer;
    let winRectsContainer;
    let fireWinNumberPrefab;
    let winElements;
    let currWinLines = [];
    let currWinScatters = [];
    let lightLinesCounter = 0;
    let lightDoneCounter = 0;
    let config;
    let cultistStack;
    const defaultConfig = {
        topScreen: true
    };

    let isClawMode;

    function start(configObj) {
        config = configObj || defaultConfig;
        isClawMode = storage.read('isClawMode');
    }

    function initWin() {
        stage = storage.read('stage');
        const loader = storage.read('loadResult');
        const fgContainer = stage.getChildByName('fgContainer');
        const gameContainer = fgContainer.getChildByName('gameContainer');
        winLinesContainer = new c.Container().set({
            name: 'winLinesContainer',
            x: gameContainer.x,
            y: gameContainer.y
        });
        winRectsContainer = new c.Container().set({
            name: 'winRectsContainer',
            x: gameContainer.x,
            y: gameContainer.y
        });

        const ss = loader.getResult('overall');
        fireWinNumberPrefab = new c.Sprite(ss).set({
            name: 'fireWinNumber',
            regX: 114, // 228
            regY: 114 // 228
        });

        fgContainer.addChildAt(winLinesContainer, 1);
        fgContainer.addChild(winRectsContainer);
        winElements = findWinElements();
    }

    function findWinElements() {
        const result = [];
        const columns = [];
        const winLines = storage.read('lines');
        const gameContainer = stage.getChildByName('fgContainer').getChildByName('gameContainer');
        for (let i = 0; i < 5; i++) {
            const column = gameContainer.getChildByName(`gameColumn${i}`);
            columns.push(column);
        }
        winLines.forEach((line, number) => {
            result[number] = [];
            line.forEach((point, position) => {
                const x = +point[0];
                const y = +point[1];
                const element = columns[position].getChildByName(`gameElement${y + 1}`);
                result[number].push(element);
            });
        });
        return result;
    }

    function drawLineShape(number) {
        const linesCoords = storage.read('linesCoords');
        const lineShape = new c.Shape();
        for (let j = 0; j < 5; j++) {
            const currentCoords = linesCoords[number - 1][j];
            if (j === 0) {
                lineShape.graphics.s('rgba(244, 233, 205, 0.15)').setStrokeStyle(2).lt(currentCoords.x, currentCoords.y);
            } else {
                lineShape.graphics.lt(currentCoords.x, currentCoords.y);
            }
        }
        lineShape.graphics.es();
        winLinesContainer.addChild(lineShape);
    }

    function drawLineLight(number) {
        let completeCounter = 0;
        const lightMas = [];
        const linesCoords = storage.read('linesCoords');
        const loader = storage.read('loadResult');

        const ss = loader.getResult('overall');
        const lightParam = {
            name: 'winLight',
            x: linesCoords[number - 1][0].x,
            y: linesCoords[number - 1][0].y
        };

        const lightHead = new c.Sprite(ss, 'glista0' ).set(lightParam);
        utils.getCenterPoint(lightHead);
        lightMas.push(lightHead);
        winLinesContainer.addChild(lightHead);

        for (let i = 0; i < 2; i++) {
            const light = new c.Sprite(ss, 'glista1' ).set(lightParam);
            utils.getCenterPoint(light);
            lightMas.push(light);
            winLinesContainer.addChild(light);
        }

        for (let i = 0; i < 2; i++) {
            const light = new c.Sprite(ss, 'glista2' ).set(lightParam);
            utils.getCenterPoint(light);
            lightMas.push(light);
            winLinesContainer.addChild(light);
        }

        for (let i = 0; i < 2; i++) {
            const light = new c.Sprite(ss, 'glista3' ).set(lightParam);
            utils.getCenterPoint(light);
            lightMas.push(light);
            winLinesContainer.addChild(light);
        }

        TweenMax.staggerTo(lightMas, 0.75,
            {bezier: {type: 'soft', values: linesCoords[number - 1], autoRotate: true},
            ease: Power1.easeOut,
            onComplete: function () {
                winLinesContainer.removeChild(this.target);
            }}, 0.050, function () {
                storage.changeState('lineLight', 'done');
                events.trigger('win:lineLight', number);
            }
        );
    }

    function drawLineText(data) {
        const loader = storage.read('loadResult');
        const ssOverall = loader.getResult('overall');
        const linesCoords = storage.read('linesCoords');
        const number = data.lineNumber;
        const amount = data.lineAmount;
        const lineWin = data.lineWin;
        const winText = new c.Container().set({
            name: 'winText',
            y: linesCoords[number - 1][amount - 1].y + 50, // Magic Numbers
            x: linesCoords[number - 1][amount - 1].x + 52 // Magic Numbers
        });
        const winLineRect = new c.Sprite(ssOverall, 'winLineRect').set({
            name: 'winLineRect',
            // y: 3,
            regX: 24,
            regY: 24,
            scaleX: 1.2,
            scaleY: 1.2
        });
        const winLineText = new c.Text(lineWin, '35px Helvetica', '#f0e194').set({
            name: 'winLineText',
            y: -1,
            textAlign: 'center',
            textBaseline: 'middle',
            shadow: new c.Shadow('#C19433', 0, 0, 8)
        });
        let bounds = winLineText.getBounds();

        if ((winLineText.text + '').length > 3) {
            winLineText.font = '19px Helvetica';
        } else if ((winLineText.text + '').length > 2) {
            winLineText.font = '24px Helvetica';
        } else if ((winLineText.text + '').length > 1) {
            winLineText.font = '30px Helvetica';
        }
        winText.addChild(winLineRect, winLineText);
        winRectsContainer.addChild(winText);
    }

    function showTotalWin(totalWinNumber) {
        const loader = storage.read('loadResult');
        const ssOverall = loader.getResult('overall');
        const totalWin = new c.Container().set({
            name: 'totalWin',
            x: utils.gameWidth / 2 + 3, // Magic Numbers
            y: utils.gameHeight / 2
        });
        const totalWinRect = new c.Sprite(ssOverall, 'winTotalRect').set({
            name: 'totalWinRect'
        });
        utils.getCenterPoint(totalWinRect);
        const totalWinText = new c.Text(totalWinNumber, '75px Helvetica', '#f0e194').set({
            name: 'totalWinText',
            textAlign: 'center',
            textBaseline: 'middle',
            shadow: new c.Shadow('#C19433', 0, 0, 8)
        });
        totalWin.addChild(totalWinRect, totalWinText);
        winRectsContainer.addChild(totalWin);
    }

    function fireWinLine(number, amount) {
        const gameTopElements = storage.read('gameTopElements');
        const winLine = storage.read('lines')[number - 1];

        let winNumbersArr = storage.read('winNumbersArr');
        if (number - 1 < winNumbersArr.length) {
            let winNumsPos = [ 4, 2, 6, 9, 10, 1, 8, 7, 3, 5];
            winNumbersArr[number - 1][0].visible = true;
            winNumbersArr[number - 1][1].visible = true;

            let winNumInd = winNumsPos.indexOf(+number);
            let plusMarginTop = 0;
            if (+winNumInd === 4) plusMarginTop = 3;
            else if (+winNumInd > 4) plusMarginTop = 5;

            const fireWinNumberLeft = fireWinNumberPrefab.clone().set({
                name: 'winNumber1',
                x: -32,
                y: 40 + winNumInd * 50 + plusMarginTop
            });
            const fireWinNumberRight = fireWinNumberPrefab.clone().set({
                name: 'winNumber2',
                x: 990,
                y: 40 + winNumInd * 50 + plusMarginTop
            });
            winRectsContainer.addChild(fireWinNumberLeft, fireWinNumberRight);
            fireWinNumberLeft.gotoAndPlay('fireWinNumber');
            fireWinNumberRight.gotoAndPlay('fireWinNumber');
        }

        if (defaultConfig.topScreen) {
            currWinLines.push({
                number: number,
                amount: amount,
                winLine: winLine
            });

            for (let i = 0; i < amount; i++) {
                const element = winElements[number - 1][i];
                const elementIndex = element.currentAnimation.split('-')[0];
                let topElement = gameTopElements[+winLine[i][0]][+winLine[i][1]];
                element.visible = false;
                topElement.visible = true;

                topElement.gotoAndPlay(`${elementIndex}-w`);
            }
        } else {
            for (let i = 0; i < amount; i++) {
                const element = winElements[number - 1][i];
                const elementIndex = element.currentAnimation.split('-')[0];
                element.gotoAndPlay(`${elementIndex}-w`);
            }
        }

        drawLineLight(number);
    }

    function drawAnotherLine(index) {
        cleanWin();
        if (index === winData.winLines.length) {
            index = 0;
        }
        const winLine = winData.winLines[index];
        if (+winLine.lineNumber !== -1) {
            fireWinLine(winLine.lineNumber, winLine.lineAmount);
            drawLineText(winLine);
        } else if (+winLine.lineWin !== 0) {
            fireAllScatters();
        } else {
            // fireScatterWild();
        }
        storage.changeState('anotherLine', index);
        events.trigger('win:anotherLine', index);
    }

    function fireAllScatters() {
        const gameTopElements = storage.read('gameTopElements');
        winElements.forEach((winLine) => {
            winLine.forEach((element, colInd) => {
                const animationName = element.currentAnimation;
                const elementIndex = animationName.split('-')[0];
                if (animationName === '10-n') {
                    if (defaultConfig.topScreen) {
                        let topElement = gameTopElements[colInd][+element.posY];
                        element.visible = false;
                        topElement.visible = true;
                        topElement.gotoAndPlay(`${elementIndex}-w`);
                    } else {
                        element.gotoAndPlay(`${elementIndex}-w`);
                    }

                    currWinScatters.push({
                        el: element,
                        colInd: colInd
                    });
                }
            });
        });
        if (storage.read('rollResponse').BonusResults[0] === 'FreeSpinBonus') {
            storage.write('isFreeSpin', true);
            setTimeout(function () {
                events.trigger('initFreeSpins');
            }, 1000);
        }
    }

    function calcCardCoords(rot, x0, y0) {
        let xFinal, yFinal;
        if (rot < 90) {
            xFinal = x0 + Math.tan(rot) * utils.height * 1 / 3;
            yFinal = y0 - utils.height * 1 / 3;
        } else if (rot < 180) {
            xFinal = x0 + Math.tan(rot - 90) * utils.height;
            yFinal = y0 + utils.height;
        } else if (rot < 270) {
            xFinal = x0 - Math.tan(rot - 180) * utils.height;
            yFinal = y0 + utils.height;
        } else if (rot < 360) {
            xFinal = x0 - Math.tan(rot - 270) * utils.height * 1 / 3;
            yFinal = y0 - utils.height * 1 / 3;
        }
        return {
            x: xFinal,
            y: yFinal
        };
    }

    function drawTotalWin(lines) {
        lines.forEach((line) => {
            const lineNumber = line.lineNumber;
            const lineAmount = line.lineAmount;
            const lineWin = line.lineWin;
            if (+lineNumber !== -1) {
                fireWinLine(lineNumber, lineAmount);
                lightLinesCounter++;
            } else {
                fireAllScatters();
            }
        });
        const totalWin = storage.read('rollResponse').TotalWinCoins;
        if (totalWin > 0) {
            showTotalWin(totalWin);
        }
    }

    function parseWinResult(arr) {
        const result = [];
        arr.forEach((line) => {
            const lineAmount = +parseInt(line, 10);
            const lineNumber = +parseInt(line.substr(line.indexOf('#') + 1), 10);
            const lineWin = +parseInt(line.substr(line.indexOf(':') + 1), 10);
            const lineObj = {
                lineAmount,
                lineNumber,
                lineWin
            };
            result.push(lineObj);
        });
        return result;
    }

    function showWin() {
        const rollData = storage.read('rollResponse');
        winData.winCoins = rollData.TotalWinCoins;
        winData.winCents = rollData.TotalWinCents;
        winData.winLines = parseWinResult(rollData.LinesResult);
        if (winData.winLines.length) {
            drawTotalWin(winData.winLines);
            createjs.Sound.play('lineWinSound');
        }
    }

    function showClaw() {
        let isCombo = false;
        const loader = storage.read('loadResult');
        const fg = stage.getChildByName('fgContainer');
        const gameContainer = fg.getChildByName('gameContainer');

        let clawsStack = [];
        let timer = 0;
        Object.keys(cultistStack).forEach((columKey) => {
            let colum = cultistStack[columKey];
            let itemsKey = Object.keys(colum.items);
            if (itemsKey.length === 3) {
                isCombo = true;
                let gameColum = gameContainer.getChildByName('gameColumn' + colum.ind);
                let clawX = 75 + 200 * (colum.ind - 1); // 160, 360, 560

                const ssClaw = loader.getResult('claw');
                const claw = new c.Sprite(ssClaw).set({
                    name: 'claw',
                    x: clawX,
                    y: -570,
                    scaleX: 1.25,
                    scaleY: 1.25,
                    visible: false
                });
                gameContainer.addChild(claw);
                clawsStack.push({
                    elem: claw,
                    pos: colum.ind
                });

                storage.write('claw', claw);

                setTimeout(() => {
                    /* eslint-disable dot-notation */
                    claw.visible = true;
                    claw.gotoAndPlay('combo');
                    setTimeout(() => {
                        let elem = colum.items['cultist0'].elem;
                        let elemPars = elem.currentAnimation.split('-');
                        elem.gotoAndPlay(elemPars[0] + '-h');
                        setTimeout(() => {
                            elem.visible = false;
                        }, 300);
                        freeSpin.eatCultist();
                    }, 400);
                    setTimeout(() => {
                        let elem = colum.items['cultist1'].elem;
                        let elemPars = elem.currentAnimation.split('-');
                        elem.gotoAndPlay(elemPars[0] + '-h');
                        setTimeout(() => {
                            elem.visible = false;
                        }, 300);
                        freeSpin.eatCultist();
                    }, 1000);
                    setTimeout(() => {
                        let elem = colum.items['cultist2'].elem;
                        let elemPars = elem.currentAnimation.split('-');
                        elem.gotoAndPlay(elemPars[0] + '-h');
                        setTimeout(() => {
                            elem.visible = false;
                        }, 300);
                        freeSpin.eatCultist();
                    }, 1900);
                    setTimeout(() => {
                        claw.x += 85;
                        claw.y = 0;
                        claw.gotoAndPlay('idle');
                    }, 2250);
                    /* eslint-enable dot-notation */
                }, 1000);
            } else
            if (itemsKey.length > 0) {
                // itemsKey.forEach(() => {
                //     freeSpin.eatCultist();
                // });
                // claw.gotoAndPlay('zahvat');
            }
        });
        storage.write('clawsStack', clawsStack);
        return isCombo;
    }

    function _elemPlayDefaultAnim(el) {
        let animationParse = el.currentAnimation.split('-');
        let elementIndex = animationParse[0];
        let elementMode = animationParse[1];

        if (elementMode !== 'n'
            || !el.currentAnimationFrame
        ) {
            el.gotoAndPlay(`${elementIndex}-n`);
        }

        el.set({
            scaleX: 1,
            scaleY: 1
        });
    }

    function cleanWin() {
        let winNumbersArr = storage.read('winNumbersArr');

        winElements.forEach((line) => {
            line.forEach((element) => {
                _elemPlayDefaultAnim(element);
            });
        });

        if (defaultConfig.topScreen) {
            const gameTopElements = storage.read('gameTopElements');

            if (currWinLines.length) {
                currWinLines.forEach((lineData) => {
                    let number = lineData.number;
                    let amount = lineData.amount;
                    let winLine = lineData.winLine;
                    for (let i = 0; i < amount; i++) {
                        const element = winElements[number - 1][i];
                        const topElement = gameTopElements[+winLine[i][0]][+winLine[i][1]];

                        let animationParse = element.currentAnimation.split('-');
                        let elementIndex = animationParse[0];

                        element.visible = true;
                        topElement.visible = false;
                    }
                });

                currWinLines = [];
            }

            if (currWinScatters.length) {
                currWinScatters.forEach((scatter) => {
                    let element = scatter.el;
                    let topElement = gameTopElements[scatter.colInd][+element.posY];
                    element.visible = true;
                    topElement.visible = false;
                });
                currWinScatters = [];
            }
        }

        winNumbersArr.forEach((line) => {
            line[0].visible = false;
            line[1].visible = false;
        });

        winLinesContainer.removeAllChildren();
        winRectsContainer.removeAllChildren();
        lightLinesCounter = 0;
        lightDoneCounter = 0;
    }

    function startRoll() {
        cleanWin();
        if (storage.read('lineTimeout')) {
            clearTimeout(storage.read('lineTimeout'));
        }
    }

    function endRoll() {
        let time;

        if (storage.read('rollResponse').LinesResult.length > 0) {
            time = 1000;
        } else {
            time = 300;
        }

        if (isClawMode) {
            // TODO: Изменять время в зависимости от количества выпавших культистов
            cultistStack = {};

            winElements.forEach((winLine) => {
                winLine.forEach((element, colInd) => {
                    const animationName = element.currentAnimation;
                    const elementIndex = animationName.split('-')[0];
                    if (+elementIndex > 10 && +elementIndex < 20) {
                        // let topElement = gameTopElements[colInd][+element.posY];
                        // topElement.visible = true;
                        if (!cultistStack['colum' + colInd]) {
                            cultistStack['colum' + colInd] = {
                                ind: colInd,
                                items: {}
                            };
                        }

                        if (!cultistStack['colum' + colInd].items['cultist' + element.posY]) {
                            cultistStack['colum' + colInd].items['cultist' + element.posY] = {
                                pos: element.posY,
                                elem: element
                            };
                            element.gotoAndPlay(`${elementIndex}-w`);
                        }
                    }
                });
            });

            // Условие: все анимации claws проигрываются синхронно
            if ( showClaw() ) time = 3700;
        }

        showWin();

        if (storage.read('rollResponse').BonusResults.length) {
            storage.changeState('lockedMenu', true);
        }

        if (storage.readState('mode') === 'fsBonus') {
            let count = storage.read('rollResponse').TotalFreeSpins;
            storage.changeState('fsMulti', storage.read('rollResponse').Multiplier.MultiplierValue);
            storage.changeState('fsLevel', storage.read('rollResponse').Multiplier.MultiplierStep);
            if (count > 0) {
                console.log('I start free Spin', count);
                const fsTimeout = setTimeout(function () {
                    freeSpin.startFreeSpin();
                }, time);
                storage.write('fsTimeout', fsTimeout);
            } else {
                storage.write('isFreeSpin', false);
                console.warn('I am stoping Free Spins!');
                events.trigger('finishFreeSpins');
            }
        } else {
            if (storage.readState('autoplay') === 'started') {
                const autoTimeout = setTimeout(function () {
                    autoplay.startAutoplay();
                }, time);
                storage.write('autoTimeout', autoTimeout);
            }

        }
    }

    function finishLineLight() {
        lightDoneCounter++;
        if (lightDoneCounter === lightLinesCounter && storage.readState('mode') === 'normal') {
            if (storage.readState('autoplay') !== 'started') {
                if (storage.read('rollResponse').BonusResults.length === 0) {
                    storage.changeState('lineByLine', 'started');
                    events.trigger('win:lineByLine', 0);
                }
            }
        }
    }

    function showNextLine() {
        let lineTimeout = setTimeout(function () {
            drawAnotherLine(storage.readState('anotherLine') + 1);
        }, 1500);
        storage.write('lineTimeout', lineTimeout);
    }

    function showMulti() {
        if (storage.readState('roll') === 'ended') {
            events.trigger('multiplierBonus', storage.read('fsMultiplierResponse'));
        }
    }

    return {
        start,
        initWin,
        cleanWin,
        startRoll,
        endRoll,
        drawAnotherLine,
        finishLineLight,
        showNextLine,
        showMulti
    };
})();

/* eslint-disable no-undef */
const buttons = (function () {

    const c = createjs;

    const buttonsContainer = new c.Container().set({
        name: 'buttonsContainer',
        x: 1080
    });
    const buttonsCache = new c.Container().set({
        name: 'buttonsCache'
    });

    function handleSpinClick() {
        const rollState = storage.readState('roll');
        const fastRoll = storage.readState('fastRoll');
        const lockedRoll = storage.readState('lockedRoll');
        if (!lockedRoll) {
            if (rollState !== 'started') {
                roll.startRoll();
                spinButton.gotoAndStop('spinOff');
                TweenMax.to(spinButton, 0.5, {rotation: -45});
            }
            if (fastRoll) {
                spinButton.gotoAndStop('spinOff');
                storage.changeState('fastRoll', 'enabled');
                TweenMax.to(spinButton, 0.5, {rotation: 0});
            }
        }
    }

    function handleSoundClick() {
        if (storage.readState('roll') !== 'started') {
            const sound = storage.readState('sound');
            if (sound) {
                soundButton.gotoAndStop('soundOff');
                storage.changeState('sound', false);
            } else {
                soundButton.gotoAndStop('soundOut');
                storage.changeState('sound', true);
            }
            buttonsCache.updateCache();
        }
    }

    function handleMenuClick() {
        if (storage.readState('roll') !== 'started') {
            storage.changeState('menu', 'settings');
        }
    }

    function handleAutoClick() {
        if (storage.readState('roll') !== 'started' && autoButton.currentAnimation !== 'autoStop') {
            storage.changeState('menu', 'auto');
        }
        if (autoButton.currentAnimation === 'autoStop') {
            storage.changeState('autoplay', 'ended');
        }
    }

    function handleBetClick() {
        if (storage.readState('roll') !== 'started') {
            storage.changeState('menu', 'bet');
        }
    }

    function drawButtons() {
        const stage = storage.read('stage');
        const loader = storage.read('loadResult');
        const ss = loader.getResult('buttons');
        spinButton = new c.Sprite(ss, 'spinOut').set({
            name: 'spinButton',
            x: 100,
            y: 360,
            regX: 87,
            regY: 87
        });
        spinButton.on('click', handleSpinClick);
        autoButton = new c.Sprite(ss, 'autoOut').set({
            name: 'autoButton',
            x: 98,
            y: 210,
            regX: 50,
            regY: 50
        });
        autoButton.on('click', handleAutoClick);
        betButton = new c.Sprite(ss, 'betOut').set({
            name: 'betButton',
            x: 98,
            y: 510,
            regX: 50,
            regY: 50
        });
        betButton.on('click', handleBetClick);
        menuButton = new c.Sprite(ss, 'menuOut').set({
            name: 'menuButton',
            x: 60,
            y: 70
        });
        menuButton.on('click', handleMenuClick);
        soundButton = new c.Sprite(ss, 'soundOff').set({
            x: 60,
            y: 570,
            name: 'soundButton'
        });
        soundButton.on('click', handleSoundClick);

        storage.changeState('sound', false);
        buttonsCache.addChild(autoButton, betButton, menuButton, soundButton);
        buttonsContainer.addChild(spinButton, buttonsCache);
        stage.addChildAt(buttonsContainer, 1);
        buttonsCache.cache(0, 0, utils.width, utils.height);
    }

    function changeButtonsPosition(side) {
        const tl = new TimelineMax();
        // if (side === 'right') {
        //     tl
        //         .to(buttonsContainer, 0.25, {x: 1280})
        //         .to(buttonsContainer, 0, {x: -300})
        //         .to(buttonsContainer, 0.25, {x: 14});
        // }
        if (side === 'left') {
            tl
                .to(buttonsContainer, 0.25, {x: -300})
                .to(buttonsContainer, 0, {x: 1280})
                .to(buttonsContainer, 0.25, {x: 1080});
        }
        if (side === 'center' || side === 'right') {
            const end = (buttonsContainer.x > 1000) ? 1300 : -300;
            tl
                .to(buttonsContainer, 0.25, {x: end});
        }
    }

    function writeAutoplay() {
        console.log('Я перехожу на режим автоигры)');
        spinButton.gotoAndStop('spinAuto');
        autoButton.gotoAndStop('autoStop');
        buttonsCache.updateCache();
        const autoCount = storage.read('autoCount');
        const autoText = new c.Text(autoCount, '70px Helvetica', '#90fd5a').set({
            name: 'autoText',
            textAlign: 'center',
            textBaseline: 'middle',
            x: spinButton.x,
            y: spinButton.y,
            shadow: new c.Shadow('#90fd5a', 0, 0, 8)
        });
        buttonsContainer.addChild(autoText);
    }
    function removeAutoplay() {
        spinButton.gotoAndStop('spinOut');
        autoButton.gotoAndStop('autoOut');
        buttonsCache.updateCache();
        const autoText = buttonsContainer.getChildByName('autoText');
        buttonsContainer.removeChild(autoText);
    }
    function updateAutoplay() {
        const autoCount = storage.read('autoCount');
        if (buttonsContainer.getChildByName('autoText')) {
            const autoText = buttonsContainer.getChildByName('autoText');
            autoText.text = autoCount;
        }
    }

    function checkState(state) {
        if (state === 'bgDraw' && storage.readState('bgDraw') === 'main') {
            drawButtons();
        }
        if (state === 'side') {
            changeButtonsPosition(storage.readState(state));
        }
        if (state === 'fastRoll' && storage.readState(state) === true && storage.readState('autoplay') !== 'started') {
            spinButton.gotoAndStop('spinOn');
        }
        if (state === 'roll' && storage.readState('autoplay') !== 'started') {
            if (storage.readState(state) === 'ended') {
                spinButton.gotoAndStop('spinOut');
                menuButton.gotoAndStop('menuOut');
                autoButton.gotoAndStop('autoOut');
                betButton.gotoAndStop('betOut');
                buttonsCache.updateCache();
                TweenMax.to(spinButton, 0.2, {rotation: 0});
            }
            if (storage.readState(state) === 'started') {
                menuButton.gotoAndStop('menuOff');
                autoButton.gotoAndStop('autoOff');
                betButton.gotoAndStop('betOff');
                buttonsCache.updateCache();
            }
        }
        if (state === 'autoplay') {
            if (storage.readState(state) === 'started') {
                writeAutoplay();
            } else {
                removeAutoplay();
            }
        }
        if (state === 'autoCount') {
            updateAutoplay();
        }
    }

    events.on('changeState', checkState);
})();

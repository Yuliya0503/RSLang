import API from '../../application/api';
import BaseGamePage from '../baseGamePage';
import { IWord, GameState } from '../../utils/types';
import { shuffle, createHTMLElement, randomInt } from '../../utils/helpers';
import { Constants } from '../../utils/constants';
import './circles.css';

class SprintPage extends BaseGamePage {
    answer: boolean;
    time: number;
    score: number;
    point: number;
    truePoints: number;
    word: IWord | undefined;
    wordRandom: IWord | undefined;

    constructor(api: API) {
        super(api);
        this.answer = true;
        this.time = 60;
        this.score = 0;
        this.point = 10;
        this.truePoints = 0;
    }

    init(query: URLSearchParams) {
        super.init(query);
    }

    gameName() {
        return 'СПРИНТ';
    }

    async generateGame() {
        const words = await this.api.getWordList(this.group, this.page);
        this.words = shuffle(words);
        this.statistic = [];
        this.renderSprintGame();
        this.wordIndex = -1;
    }

    timer() {
        const setIntervalId = setInterval(() => {
            const timeSprint = document.querySelector('#sprint-time');
            if (this.time >= 0 && timeSprint) {
                (timeSprint as HTMLElement).innerText = ` Time: ${this.time}`;
                this.time -= 1;
            } else {
                clearInterval(setIntervalId);
                this.endGame();
            }
            return this.time;
        }, 1000);
        return setIntervalId;
    }

    nextWord() {
        if (this.wordIndex < this.words.length - 2) {
            this.wordIndex += 1;
        } else {
            this.wordIndex = 0;
        }
        const answerTranslate = document.querySelector('.sprint__translate') as HTMLElement;
        const random = randomInt(2);
        if (random === 1) {
            this.wordRandom = this.words[this.wordIndex];
        } else {
            this.wordRandom = this.words[randomInt(Constants.WORDS_PER_GROUP - 1)];
        }
        answerTranslate.innerText = `${this.wordRandom.wordTranslate}`;
        const answerWord = document.querySelector('.sprint__word') as HTMLElement;
        answerWord.innerText = `${this.words[this.wordIndex].word}`;
        this.answer = Boolean(this.words[this.wordIndex]._id === this.wordRandom._id);
        this.word = this.words[this.wordIndex] as IWord;
        return this.word;
    }

    async renderSprintGame() {
        this.gameState = GameState.Question;
        const MAIN = document.querySelector('.main') as HTMLElement;
        MAIN.innerHTML = `<main class="sprint__main">
            <div class="sprint__timer" id="sprint-time">${this.timer()}</div>
            <div class="sprint__score">${this.score}</div>
            <div class="sprint__score_points">${this.addSpans()}</div>
            <div class="sprint__word"></div>
            <div class="sprint__translate"></div>
            <button class="sprint__button" type="button"id="sprint-yes">Верно</button>
            <button class="sprint__button" type="button"id="sprint-no">Неверно</button>
        </main>`;
        this.nextWord();
        (MAIN.querySelector('#sprint-yes') as HTMLElement).addEventListener('click', () => {
            this.answerCheck(true, this.word as IWord);
            this.addStyleBtn('#sprint-yes', '#sprint-no', 'active-button');
        });
        (MAIN.querySelector('#sprint-no') as HTMLElement).addEventListener('click', () => {
            this.answerCheck(false, this.word as IWord);
            this.addStyleBtn('#sprint-no', '#sprint-yes', 'active-button');
        });
        this.answerKey(this.word as IWord);
    }

    addStyleBtn(idAdd: string, idRemove: string, style: string) {
        (document.querySelector(idAdd) as HTMLElement).classList.add(style);
        (document.querySelector(idRemove) as HTMLElement).classList.remove(style);
    }

    addSpans() {
        return `<span class="circles" id="circle1"></span>
        <span class="circles" id="circle2"></span>
        <span class="circles" id="circle3"></span>
        <span class="points">+${this.point}</span>`;
    }

    getSwitch(truePoints: number) {
        switch (truePoints) {
            case 1:
                this.point = 10;
                break;
            case 4:
                this.point = 20;
                break;
            case 7:
                this.point = 40;
                break;
            case 10:
                this.point = 80;
                break;
        }
    }

    addStyle(truePoints: number) {
        const bill = truePoints % 3;
        const span1 = document.querySelector('#circle1') as HTMLElement;
        const span2 = document.querySelector('#circle2') as HTMLElement;
        const span3 = document.querySelector('#circle3') as HTMLElement;
        if (truePoints === 0) {
            span1.classList.remove('active');
            span2.classList.remove('active');
            span3.classList.remove('active');
        } else if (bill === 1) {
            span1.classList.add('active');
            span2.classList.remove('active');
            span3.classList.remove('active');
        } else if (bill === 2) {
            span2.classList.add('active');
        } else {
            span3.classList.add('active');
        }
    }
    answerRight() {
        const point = document.querySelector('.points') as HTMLElement;
        this.truePoints += 1;
        this.getSwitch(this.truePoints);
        this.addStyle(this.truePoints);
        this.score += this.point;
        point.innerText = `+${this.point}`;
    }

    answerWrong() {
        const point = document.querySelector('.points') as HTMLElement;
        this.truePoints = 0;
        this.addStyle(this.truePoints);
        point.innerText = `+${(this.point = 10)}`;
    }

    answerCheck(bthAnswer: boolean, word: IWord) {
        const score = document.querySelector('.sprint__score') as HTMLElement;
        if (bthAnswer === this.answer) {
            super.addWordstatistic(word, true);
            this.answerRight();
        } else {
            super.addWordstatistic(word, false);
            this.answerWrong();
        }
        score.innerText = `${this.score}`;
        this.nextWord();
    }

    answerKey(word: IWord) {
        (document.querySelector('body') as HTMLElement).addEventListener('keydown', (event) => {
            const score = document.querySelector('.sprint__score') as HTMLElement;
            const keyName = event.key;
            if (keyName === 'ArrowLeft') {
                this.addStyleBtn('#sprint-yes', '#sprint-no', 'active-button');
                return this.answerCheck(true, word);
            }
            if (keyName === 'ArrowRight') {
                this.addStyleBtn('#sprint-no', '#sprint-yes', 'active-button');
                return this.answerCheck(false, word);
            }
            score.innerText = `${this.score}`;
        });
    }

    endGame(): void {
        super.endGame();
        const scoreResult = createHTMLElement('div', 'root__statistics__label', `Набрано баллов: ${this.score}`);
        const MAIN = document.querySelector('.main') as HTMLElement;
        MAIN.prepend(scoreResult);
    }
}

export default SprintPage;

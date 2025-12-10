import { Container, Text, Ticker } from "pixi.js";
import { EVENTS } from "../../assets/configs/signals";
import { signal } from "./SignalService";
import { TextStyles } from "../../assets/configs/styles";

export class Clock extends Container {
    private timeLeft: number;
    private isTicking = false;
    private readonly initialTime: number;
    private elapsed = 0;

    private readonly timer: Text;
    private readonly onEndCallback: (() => void) | null = null;

    constructor(seconds: number, onEnd?: () => void) {
        super();
        this.initialTime = seconds;
        this.timeLeft = seconds;
        this.onEndCallback = onEnd ?? null;

        this.timer = new Text({
            text: this.formatTime(seconds),
            style: TextStyles.counterText,
        });

        this.addChild(this.timer);
    }

    start() {
        if (this.isTicking) return;

        this.isTicking = true;
        this.elapsed = 0;

        Ticker.shared.add(this.update, this);
    }

    pause() {
        if (!this.isTicking) return;
        this.isTicking = false;
        Ticker.shared.remove(this.update, this);
    }

    resume() {
        if (!this.isTicking) this.start();
    }

    stop() {
        this.isTicking = false;
        Ticker.shared.remove(this.update, this);
    }

    private update(ticker: Ticker) {
        this.elapsed += ticker.deltaMS / 1000;

        if (this.elapsed >= 1) {
            this.elapsed -= 1;
            this.timeLeft--;
            this.timer.text = this.formatTime(this.timeLeft);

            if (this.timeLeft <= 0) {
                this.stop();
                signal.dispatch(EVENTS.LEVEL_COMPLETE, false );
                this.onEndCallback?.();
            }
        }
    }

    addTime(seconds: number){
        this.timeLeft += seconds;
        this.timer.text = this.formatTime(this.timeLeft);
    }

    public getResultStars(): number {
        if (this.timeLeft <= 0) return 0;

        const ratio = this.timeLeft / this.initialTime;

        if (ratio >= 2/3) return 3;
        if (ratio >= 1/3) return 2;
        return 1;
    }

    private formatTime(sec: number): string {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }
}

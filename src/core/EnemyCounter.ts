import { Container, Text } from "pixi.js";
import { signal } from "./SignalService";
import { EVENTS } from "../../assets/configs/signals";
import { TextStyles } from "../../assets/configs/styles";

export class EnemyCounter extends Container {
    private killed = 0;
    private text!: Text;
    private titleLabel!: Text;

    constructor(private total: number) {
        super();
        this.createUI();
        signal.on(EVENTS.ENEMY_SLAIN, this.handleEnemySlain);
    }

    private createUI() {
        this.createTitle();
        this.createCounterText();
        this.updateDisplay();
    }

    private createTitle() {
        this.titleLabel = new Text({
            text: "Enemies killed",
            style: TextStyles.enemyCounterTitle,
        });
        this.titleLabel.anchor.set(0.5);
        this.addChild(this.titleLabel);
    }

    private createCounterText() {
        this.text = new Text({
            text: "",
            style: TextStyles.counterText,
        });
        this.text.anchor.set(0.5);
        this.text.y = this.titleLabel.height;
        this.addChild(this.text);
    }

    private handleEnemySlain = () => {
        this.killed++;
        this.updateDisplay();

        if (this.killed >= this.total) {
            this.notifyLevelComplete();
        }
    };

    private notifyLevelComplete() {
        signal.dispatch(EVENTS.LEVEL_COMPLETE, true);
    }

    private updateDisplay() {
        this.text.text = `${this.killed} / ${this.total}`;
    }

    override destroy(options?: any): void {
        signal.off(EVENTS.ENEMY_SLAIN, this.handleEnemySlain);
        super.destroy(options);
    }
}

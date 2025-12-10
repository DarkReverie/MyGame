import { BaseScene } from "../core/BaseScene";
import { Sprite, Container, Text, Graphics } from "pixi.js";
import { view } from "../../assets/configs/stages";
import { AssetService } from "../core/AssetService";
import { signal } from "../core/SignalService";
import { EVENTS } from "../../assets/configs/signals";
import { Clock } from "../core/Clock";
import { EnemyCounter } from "../core/EnemyCounter";
import { WinLosePopup } from "../core/WinLosePopup";
import { Demon } from "../game/Demon";
import { ENEMIES_CONFIG } from "../../assets/configs/enemies";
import gsap from "gsap";
import { SceneManager } from "../core/SceneManager";
import { TextStyles, UI } from "../../assets/configs/styles";
import { SoundManager } from "../core/SoundManager";

export class LevelScene extends BaseScene {
    private readonly levelType: number;
    private clock!: Clock;
    private counter!: EnemyCounter;

    private pauseBtn!: Container;
    private soundBtn!: Container;
    private boosterBtn!: Container;
    private buttonContainer = new Container();

    private isComplete = false;
    private paused = false;
    private _initialized = false;

    private readonly handleLevelComplete = (win: boolean) => {
        this.isComplete = win;
        signal.dispatch(win ? EVENTS.SOUND_WIN : EVENTS.SOUND_LOSE, {});
        this.finishLevel();
    };

    constructor(levelIndex: number) {
        super();
        this.levelType = levelIndex;
        this.init();
        signal.on(EVENTS.LEVEL_COMPLETE, this.handleLevelComplete);
    }

    async init() {
        const { width, height } = view.screen.land;

        await this.loadBackground(width, height);
        this.initEnemies();
        this.initClock(width, height);
        this.initEnemyCounter(width, height);

        this.initButtons();
        this.addChild(this.buttonContainer);
        this.layoutButtons();

        this.pivot.set(width / 2, height / 2);
        this._initialized = true;

        SceneManager.getInstance().forceResize();
    }


    private initButtons() {
        this.createPauseButton();
        this.createSoundButton();
        this.createBoosterButton();
    }

    private createPauseButton() {
        this.pauseBtn = this.button("Pause", () => this.togglePause());
    }

    private createSoundButton() {
        const initial = SoundManager.isSoundEnabled() ? "Sound ON" : "Sound OFF";
        this.soundBtn = this.button(initial, () => this.toggleSound());
    }

    private createBoosterButton() {
        const manager = SceneManager.getInstance();
        const available = manager.isBoosterAvailable();

        this.boosterBtn = this.button(
            "+30s",
            () => this.useBooster(),
            available ? UI.buttonColor : 0x555555
        );

        if (!available) this.disable(this.boosterBtn);
    }

    private button(text: string, onClick: () => void, color = UI.buttonColor): Container {
        const c = new Container();
        c.eventMode = "static";
        c.cursor = "pointer";

        const label = new Text({ text, style: TextStyles.buttonText });
        label.anchor.set(0.5);

        const bg = new Graphics()
            .roundRect(
                -(label.width + UI.buttonPadding) / 2,
                -(label.height + UI.buttonPadding) / 2,
                label.width + UI.buttonPadding,
                label.height + UI.buttonPadding,
                UI.cornerRadius
            )
            .fill(color);

        c.addChild(bg, label);

        c.on("pointerover", () => (c.tint = UI.buttonHoverColor));
        c.on("pointerout", () => (c.tint = 0xffffff));
        c.on("pointerdown", onClick);

        this.buttonContainer.addChild(c);
        return c;
    }

    private disable(btn: Container) {
        btn.tint = UI.buttonHoverColor;
        btn.eventMode = "none";
        btn.cursor = "default";
    }

    private togglePause() {
        this.paused = !this.paused;

        this.modifyEnemies(d => (this.paused ? d.pause() : d.resume()));
        this.paused ? this.clock.pause() : this.clock.resume();
        this.paused ? gsap.globalTimeline.pause() : gsap.globalTimeline.resume();

        const label = this.pauseBtn.getChildAt(1) as Text;
        label.text = this.paused ? "Paused" : "Pause";
    }

    private toggleSound() {
        signal.dispatch(EVENTS.SOUND_TOGGLE, {});
        const label = this.soundBtn.getChildAt(1) as Text;
        label.text = SoundManager.isSoundEnabled() ? "Sound ON" : "Sound OFF";
    }

    private useBooster() {
        const manager = SceneManager.getInstance();
        if (!manager.isBoosterAvailable()) return;

        this.clock.addTime(30);
        manager.useBooster();
        this.disable(this.boosterBtn);
    }

    private async loadBackground(w: number, h: number) {
        const bg = new Sprite(await AssetService.getTexture(`level_${this.levelType}`));
        bg.anchor.set(0.5);
        bg.scale.set(3);
        bg.position.set(w / 2, h / 2);
        this.addChild(bg);
    }

    private initClock(w: number, h: number) {
        this.clock = new Clock(15);
        this.clock.position.set(w / 2, h * 0.1);
        this.clock.pivot.set(this.clock.width / 2, this.clock.height / 2);
        this.addChild(this.clock);
        this.clock.start();
    }

    private initEnemyCounter(w: number, h: number) {
        this.counter = new EnemyCounter(ENEMIES_CONFIG[this.levelType]!.length);
        this.counter.position.set(w * 0.5, h * 0.18);
        this.counter.scale.set(0.5);
        this.addChild(this.counter);
    }

    private initEnemies() {
        ENEMIES_CONFIG[this.levelType]!.forEach(cfg => {
            const d = new Demon();
            d.setBounds(cfg.bounds);
            d.setSpeed(
                (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1),
                (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1)
            );
            this.addChild(d);
        });
    }

    private finishLevel() {
        this.clock.stop();
        this.showPopup();
    }

    private showPopup() {
        const popup = new WinLosePopup(this.isComplete, this.clock.getResultStars(), this.levelType);
        popup.position.set(this.x, this.y);
        this.addChild(popup);
    }

    private modifyEnemies(fn: (d: Demon) => void) {
        this.children.forEach(c => c instanceof Demon && fn(c));
    }


    resize(stageConfig: any) {
        if (!this._initialized) return;

        const { width, height } = stageConfig;
        this.x = width / 2;
        this.y = height / 2;

        this.clock.position.set(width * 0.5, height * 0.1);
        this.counter.position.set(width * 0.5, height * 0.18);
        this.buttonContainer.position.set(width * 0.5, height * 0.9);
    }

    private layoutButtons() {
        this.buttonContainer.children.forEach((btn, i) => (btn.x = i * 400));
        this.buttonContainer.pivot.set(
            this.buttonContainer.width / 2.5,
            this.buttonContainer.height / 2
        );
    }

    override destroy(options?: any): void {
        signal.off(EVENTS.LEVEL_COMPLETE, this.handleLevelComplete);
        super.destroy(options);
    }
}

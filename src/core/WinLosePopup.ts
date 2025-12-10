import { Container, Graphics, Text } from "pixi.js";
import { signal } from "./SignalService";
import { EVENTS } from "../../assets/configs/signals";
import gsap from "gsap";
import { TextStyles, UI } from "../../assets/configs/styles";

export class WinLosePopup extends Container {
    private popupContainer = new Container();
    private nextBtn?: Graphics;

    constructor(
        private isWin: boolean,
        private stars: number,
        private levelIndex: number
    ) {
        super();
        this.visible = false;

        this.createOverlay();
        this.buildContent();
        this.addChild(this.popupContainer);

        this.animateIn();
    }

    private buildContent() {
        this.createWindow();
        this.createStars();
        this.createButtons();
    }

    private createOverlay() {
        const overlay = new Graphics()
            .rect(-4000, -2100, 8000, 4200)
            .fill(0x000000, 0.6);

        overlay.eventMode = "static";
        this.addChild(overlay);
    }

    private createWindow() {
        this.createBox();
        this.createTitle();
    }

    private createBox() {
        const box = new Graphics()
            .roundRect(-250, -400, 500, 800, 20)
            .fill(0x857cd3);

        this.popupContainer.addChild(box);
    }

    private createTitle() {
        const title = new Text({
            text: this.isWin ? "LEVEL WON" : "LEVEL LOST",
            style: this.isWin
                ? TextStyles.popupTitleWin
                : TextStyles.popupTitleLose,
        });

        title.anchor.set(0.5);
        title.y = -300;
        this.popupContainer.addChild(title);
    }

    private createStars() {
        for (let i = 0; i < 3; i++) {
            this.popupContainer.addChild(this.createStar(i));
        }
    }

    private createStar(i: number) {
        const active = i < this.stars;
        const color = active ? 0xffd700 : 0x444444;

        const star = new Graphics()
            .star(0, 0, 5, 25, 10)
            .fill({ color });

        star.visible = active || (i === this.stars && this.stars === 2);
        star.x = (i - 1) * 70;
        star.y = -230;

        return star;
    }

    private createButtons() {
        this.createRestartButton();
        this.createMenuButton();
        this.createNextButton();
    }

    private createRestartButton() {
        this.addButton("Restart", 0, 0, () => {
            signal.dispatch(EVENTS.LOAD_SCENE, {
                type: "LEVEL",
                payload: this.levelIndex,
            });
        });
    }

    private createMenuButton() {
        this.addButton("Menu", 0, 150, () => {
            signal.dispatch(EVENTS.LOAD_SCENE, { type: "MENU" });
        });
    }

    private createNextButton() {
        this.nextBtn = this.addButton("Next", 0, 300, () => {
            const next = this.levelIndex + 1;
            signal.dispatch(EVENTS.LOAD_SCENE, {
                type: next >= 3 ? "MENU" : "LEVEL",
                payload: next,
            });
        });

        if (!this.isWin) this.nextBtn.visible = false;
    }

    private addButton(
        text: string,
        x: number,
        y: number,
        onClick: () => void
    ): Graphics {
        const label = new Text({
            text,
            style: TextStyles.popupButtonText,
        });

        label.anchor.set(0.5);

        const btn = new Graphics()
            .roundRect(
                -(label.width + UI.buttonPadding) / 2,
                -(label.height + UI.buttonPadding) / 2,
                label.width + UI.buttonPadding,
                label.height + UI.buttonPadding,
                UI.cornerRadius
            )
            .fill(UI.buttonColor);

        btn.position.set(x, y);
        btn.eventMode = "static";
        btn.cursor = "pointer";

        this.applyButtonEvents(btn);

        btn.on("pointerdown", onClick);
        btn.addChild(label);
        this.popupContainer.addChild(btn);
        return btn;
    }

    private applyButtonEvents(btn: Graphics) {
        btn.on("pointerover", () => (btn.tint = UI.buttonHoverColor));
        btn.on("pointerout", () => (btn.tint = 0xffffff));
    }

    private animateIn() {
        this.visible = true;
        this.popupContainer.alpha = 0;
        this.popupContainer.scale.set(0.5);

        gsap.to(this.popupContainer, {
            alpha: 1,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
        });
    }
}

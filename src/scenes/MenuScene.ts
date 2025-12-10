import { BaseScene } from "../core/BaseScene";
import { Sprite, Text, Container, Graphics } from "pixi.js";
import { view } from "../../assets/configs/stages";
import { AssetService } from "../core/AssetService";
import { signal } from "../core/SignalService";
import { EVENTS } from "../../assets/configs/signals";
import { TextStyles, UI } from "../../assets/configs/styles";

export class MenuScene extends BaseScene {

    constructor() {
        super();
        this.init();
    }

    async init() {
        const designW = view.screen.land.width;
        const designH = view.screen.land.height;

        await this.createBackground(designW, designH);
        this.createTitle(designW, designH);
        this.createStartButtons(designW, designH);

        this.pivot.set(designW / 2, designH / 2);
    }

    private async createBackground(w: number, h: number) {
        const bgTexture = await AssetService.getTexture('main_menu');

        const bg = new Sprite(bgTexture);
        bg.anchor.set(0.5, 0.3);
        bg.scale.set(3);
        bg.position.set(w / 2, h / 2);

        this.addChild(bg);
    }

    private createTitle(w: number, h: number) {
        const title = new Text({
            text: "Save the kingdom!\nClick on demons to defeat them!",
            style: TextStyles.buttonText,
        });

        title.anchor.set(0.5);
        title.position.set(w / 2, h / 2 - 200);

        this.addChild(title);
    }

    private createStartButtons(w: number, h: number) {
        const buttonContainer = new Container();
        const btn = this.createButton( 0);

        btn.position.set(w / 2, h / 2 + 550);
        buttonContainer.addChild(btn);

        this.addChild(buttonContainer);
    }

    private createButton(levelIndex: number): Container {
        const container = new Container();
        container.eventMode = "static";
        container.cursor = "pointer";

        const label = new Text({
            text: `Start`,
            style: TextStyles.buttonText,
        });
        label.anchor.set(0.5);

        const bg = this.createButtonBackground(label);

        container.addChild(bg, label);

        this.initButtonInteractivity(container, bg, levelIndex);

        return container;
    }

    private createButtonBackground(label: Text) {
        return new Graphics()
            .roundRect(
                -(label.width + UI.buttonPadding) / 2,
                -(label.height + UI.buttonPadding) / 2,
                label.width + UI.buttonPadding,
                label.height + UI.buttonPadding,
                UI.cornerRadius
            )
            .fill(UI.buttonColor);
    }

    private initButtonInteractivity(
        container: Container,
        bg: Graphics,
        levelIndex: number
    ) {
        container.on("pointerover", () => {
            bg.tint = UI.buttonHoverColor;
        });

        container.on("pointerout", () => {
            bg.tint = 0xffffff;
        });

        container.on("pointerup", () => {
            signal.dispatch(EVENTS.LOAD_SCENE, {
                type: "LEVEL",
                payload: levelIndex,
            });
        });
    }

    resize(stageConfig: any) {
        this.x = stageConfig.width / 2;
        this.y = stageConfig.height / 2;
    }
}
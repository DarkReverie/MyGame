import {Container, AnimatedSprite, Ticker} from "pixi.js";
import { AssetService } from "../core/AssetService";
import { signal } from "../core/SignalService";
import { EVENTS } from "../../assets/configs/signals";
import gsap from "gsap";

export class Demon extends Container {
    private sprite!: AnimatedSprite;
    private tween!: gsap.core.Tween;
    private killed = false;
    private bounds?: { x:number; y:number; width:number; height:number };
    private speedX = 1;
    private speedY = 1;


    constructor() {
        super();
        this.init();
        Ticker.shared.add(this.update, this);

    }

    private async init() {
        const sheet = await AssetService.getTexture('enemy');

        this.sprite = new AnimatedSprite(sheet.animations.walk);

        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();

        this.addChild(this.sprite);

        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.on("pointerdown", this.onClick);

    }

    setBounds(rect:{x:number, y:number, width:number, height:number}) {
        this.bounds = rect;
    }
    setSpeed(x:number, y:number) {
        this.speedX = x;
        this.speedY = y;
    }

    private onClick = () => {
        this.kill();
    };

    private update = () => {
        if (!this.bounds || this.killed) return;

        this.x += this.speedX;
        this.y += this.speedY;

        const b = this.bounds;

        if (this.x > b.x + b.width) {
            this.x = b.x + b.width;
            this.speedX *= -1;
        }

        if (this.x < b.x) {
            this.x = b.x;
            this.speedX *= -1;
        }

        if (this.y > b.y + b.height) {
            this.y = b.y + b.height;
            this.speedY *= -1;
        }

        if (this.y < b.y) {
            this.y = b.y;
            this.speedY *= -1;
        }
    }


    private kill() {
        if (this.killed) return;
        this.killed = true;

        this.off("pointerdown", this.onClick);

        if (this.tween) {
            this.tween.kill();
            this.tween = undefined as any;
        }

        this.sprite.stop();
        Ticker.shared.remove(this.update, this);

        signal.dispatch(EVENTS.ENEMY_SLAIN, {});

        this.playDeathAnimation();
    }


    public pause() {
        Ticker.shared.remove(this.update, this);
    }

    public resume() {
        if (!this.killed) {
            Ticker.shared.add(this.update, this);
        }
    }


    private playDeathAnimation() {
        gsap.to(this.sprite, {
            rotation: -Math.PI / 2,
            duration: 0.2,
            ease: "power1.inOut"
        });

        gsap.to(this.sprite, {
            alpha: 0,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            onComplete: () => {
                this.finishDeath();
            }
        });
    }

    private finishDeath() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.destroy({ children: true });
    }


    destroy(options?: any) {
        Ticker.shared.remove(this.update, this);
        super.destroy(options);
    }


}

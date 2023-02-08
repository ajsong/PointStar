import { _decorator, Component, Node, view, sys, Widget, Label, UITransform, Prefab, v3, size, Animation, AudioSource, SpriteFrame, Sprite, resources, AudioClip, color, v2, rect, tween, Vec2, Touch, Camera } from 'cc';
const { ccclass, property } = _decorator;
import $ from "./Helper"
import { Level } from "./Level"
import WXManager from './WXManager';

enum STORAGE_KEY {
	GAME_BGM = 'GAME_BGM',
	GAME_AUDIO = 'GAME_AUDIO',
	GAME_LEVEL = 'GAME_LEVEL',
	PROP_NUM = 'PROP_NUM'
}

@ccclass('GameManager')
export class GameManager extends Component {

	@property(Camera)
	private camera: Camera;
	@property(Node)
	menuLayer: Node;
	@property(Node)
	settingLayer: Node;
	@property(Node)
	gameLayer: Node;
	@property(Node)
	propBar: Node;
	@property(Node)
	chessArea: Node;
	@property(Node)
	lostLayer: Node;
	@property(Node)
	winLayer: Node;
	@property(Node)
	rankLayer: Node;
	@property(Node)
	bgm: Node;
	@property(Node)
	audio: Node;
	@property(Node)
	audio2: Node;
	@property(Prefab)
	chess: Prefab;
	@property([SpriteFrame])
	bgmIcons: SpriteFrame[];
	@property([SpriteFrame])
	audioIcons: SpriteFrame[];
	@property([SpriteFrame])
	chessArray: SpriteFrame[];
	@property([Prefab])
	chessEffectArray: Prefab[];

	levelIndex = 0;
	level = {};
	widthNum = 0;
	heightNum = 0;
	propNum = [0, 0, 0, 0, 0];
	stepLebel: Label;
	levelLebel: Label;
	targetView: Node;
	itemsView: Node;
	chesses = [];
	hintTimer = 0;
	isBgm = 1;
	isAudio = 1;
	audioClips = {};
	chessWidth = 0;
	insertX = [];
	fpsCount = 0;
	user = {};

	curProp = -1;
	colorIndex = 0;
	stepNum = 0;
	curHints: Node[] = [];
	target: Node[] = [];

	onLoad() {
		WXManager.instance.passiveShare();
		WXManager.instance.initBannerAd();
		WXManager.instance.initInterstitialAd();
		WXManager.instance.initVideoAd();
	}

	onEnable() {
		WXManager.instance.toggleBannerAd(true);
	}
	onDisable() {
		WXManager.instance.toggleBannerAd(false);
	}

	start() {
		this.propNum = $.storageJSON(STORAGE_KEY.PROP_NUM) || [1, 1, 1, 1, 1];
		this.isBgm = parseInt($.storage(STORAGE_KEY.GAME_BGM) || 1);
		this.isAudio = parseInt($.storage(STORAGE_KEY.GAME_AUDIO) || 1);
		if (!this.isBgm) this.bgm.active = false;
		if (!this.isAudio) this.audio.active = false;
		$.storage(STORAGE_KEY.PROP_NUM, JSON.stringify(this.propNum));

		resources.loadDir('Audio/', AudioClip, ((err, assets: [AudioClip]) => {
			assets.forEach(clip => {
				this.audioClips[clip.name] = clip;
			});
		}).bind(this));

		let win = $.screenSize();
		WXManager.instance.getUser(res => {
			this.user = res;
			console.log(res)
		}, {
			text: '',
			style: {
				width: win.width,
				height: win.height,
				backgroundColor: 'rgba(0,0,0,0)'
			}
		});
	}

	setBgm() {
		this.isBgm = this.isBgm == 1 ? 0 : 1;
		this.bgm.active = this.isBgm == 1;
		this.settingLayer.getChildByPath('Board/Button/Bgm').getComponent(Sprite).spriteFrame = this.bgmIcons[this.isBgm];
		this.settingLayer.getChildByPath('Board/Button2/Bgm').getComponent(Sprite).spriteFrame = this.bgmIcons[this.isBgm];
		$.storage(STORAGE_KEY.GAME_BGM, this.isBgm);
	}

	setAudio() {
		this.isAudio = this.isAudio == 1 ? 0 : 1;
		this.audio.active = this.isAudio == 1;
		this.settingLayer.getChildByPath('Board/Button/Audio').getComponent(Sprite).spriteFrame = this.audioIcons[this.isAudio];
		this.settingLayer.getChildByPath('Board/Button2/Audio').getComponent(Sprite).spriteFrame = this.audioIcons[this.isAudio];
		$.storage(STORAGE_KEY.GAME_AUDIO, this.isAudio);
	}

	playAudio(clipName, second?: boolean) {
		if (!clipName || !clipName.length || !this.isAudio) return;
		let audio = second ? this.audio2 : this.audio;
		let audioSource = audio.getComponent(AudioSource);
		audioSource.clip = this.audioClips[clipName];
		audioSource.play();
	}

	startGame() {
		this.unschedule(this.showHint);
		this.playAudio('begin');
		this.curProp = -1;
		this.colorIndex = 0;
		this.levelIndex = parseInt($.storage(STORAGE_KEY.GAME_LEVEL) || 0);
		this.level = Level[this.levelIndex];
		this.widthNum = this.level['widthNum'];
		this.heightNum = this.level['heightNum'];

		this.menuLayer.active = false;
		this.gameLayer.active = true;
		this.settingLayer.active = false;
		this.lostLayer.active = false;
		this.winLayer.active = false;
		this.rankLayer.active = false;

		$.getMenuButton(this.propBar.parent, true);
		this.itemsView = this.propBar.getChildByName('Items');
		this.chessWidth = this.chessArea.getComponent(UITransform).contentSize.width / this.widthNum;

		let areaWidth = this.chessArea.getComponent(UITransform).contentSize.width;
		this.chessArea.getComponent(UITransform).setContentSize(size(areaWidth, areaWidth));
		let pos = this.chessArea.getPosition();
		pos.y = pos.x * -1 - screen.height / 8;
		this.chessArea.position = pos;

		this.setTopbar();
		this.setPropNum();
		this.setChessArea();
		this.countdownHint();

		this.chessArea.on(Node.EventType.TOUCH_START, this.touchChess, this);

		this.scheduleOnce(() => {
			for (let i = 0; i < this.chessArea.children.length; i++) {
				this.chessArea.children[i].getChildByName('Bg').getComponent(Animation).play();
			}
		}, 0.05);
	}

	nextGame() {
		this.playAudio('click2');
		this.startGame();
	}

	resetGame() {
		this.playAudio('click2');
		this.startGame();
	}

	endGame() {
		this.unschedule(this.showHint);
		this.chessArea.off(Node.EventType.TOUCH_START, this.touchChess, this);
		this.playAudio('click2');
		this.menuLayer.active = true;
		this.gameLayer.active = false;
		this.settingLayer.active = false;
	}

	countdownHint() {
		this.scheduleOnce(this.showHint, 7);
	}

	showHint() {
		do {
			let i = $.random(0, this.widthNum - 1),
				j = $.random(0, this.heightNum - 1);
			let item = this.chesses[j][i];
			if (!item || !item.parent) continue;
			this.curHints = this.unionChess({ color: parseInt(item['color']), i: i, j: j }, []);
		} while (this.curHints.length < 2);
		this.curHints.forEach(item => item.getChildByName('Bg').getComponent(Animation).play('ChessScale'));
	}

	setTopbar() {
		this.target = [];
		this.stepNum = this.level['step'];
		this.stepLebel = this.gameLayer.getChildByPath('Top/Topbar/stepBox/Num').getComponent(Label);
		this.levelLebel = this.gameLayer.getChildByPath('Top/Topbar/levelBox/Num').getComponent(Label);
		this.targetView = this.gameLayer.getChildByPath('Top/Topbar/targetBox/TargetView');
		this.targetView.destroyAllChildren();

		this.stepLebel.string = String(this.stepNum);
		this.levelLebel.string = String(this.levelIndex + 1);

		let target = this.level['target'];
		let targetWidth = this.targetView.getComponent(UITransform).contentSize.width;
		let x = (targetWidth - ((target.length - 1) * 10 + target.length * 50)) / 2;
		target.forEach((e, index) => {
			let item = $.prefab(this.chess);
			item.attr({ color: e.type, num: e.num });
			item.getChildByName('Bg').getComponent(Sprite).spriteFrame = this.chessArray[e.type];
			let label = item.getChildByName('Label');
			label.active = true;
			label.getComponent(Label).string = String(e.num);
			item.position = v3(x + 25 + index * (50 + 10), 0);
			item.parent = this.targetView;
			this.target.push(item);
		});
	}

	setPropNum() {
		this.propNum.forEach((num, index) => {
			this.itemsView.children[index].getChildByPath('Prop/Label').active = num > 0;
			this.itemsView.children[index].getChildByPath('Prop/Ad').active = num <= 0;
			this.itemsView.children[index].getChildByPath('Prop/Label').getComponent(Label).string = String(num);
		});
	}

	setChessArea() {
		this.chessArea.destroyAllChildren();
		this.chesses = [];
		let arr = [];
		for (let j = 0; j < this.heightNum; j++) {
			for (let i = 0; i < this.widthNum; i++) {
				let color = $.random(0, this.chessArray.length - 1);
				let item = this.createChess(color, i, j);
				arr.push(item);
				if (arr.length == this.widthNum) {
					this.chesses.push(arr);
					arr = [];
				}
			}
		}
		if (arr.length) this.chesses.push(arr);
	}

	unionChess(grid, numArr) {
		let arr = [], color = grid.color, i = grid.i, j = grid.j;
		if (i < 0 || i >= this.widthNum || j < 0 || j >= this.heightNum) return [];
		let item = this.chesses[j][i];
		if (!item || !item.parent) return [];
		if (color != parseInt(item['color'])) return [];
		let num = String(j) + String(i);
		if (numArr.some(n => n === num)) return [];
		arr.push(item);
		numArr.push(num)
		if (i > 0) {
			let array = this.unionChess({ color: color, i: i - 1, j: j }, numArr);
			array.forEach(e => {
				if ((e instanceof Node)) arr.push(e);
			});
		}
		if (i < this.widthNum - 1) {
			let array = this.unionChess({ color: color, i: i + 1, j: j }, numArr);
			array.forEach(e => {
				if ((e instanceof Node)) arr.push(e);
			});
		}
		if (j > 0) {
			let array = this.unionChess({ color: color, i: i, j: j - 1 }, numArr);
			array.forEach(e => {
				if ((e instanceof Node)) arr.push(e);
			});
		}
		if (j < this.heightNum - 1) {
			let array = this.unionChess({ color: color, i: i, j: j + 1 }, numArr);
			array.forEach(e => {
				if ((e instanceof Node)) arr.push(e);
			});
		}
		return arr;
	}

	createChess(colorIndex, i, j) {
		let x = this.chessWidth / 2 + i * this.chessWidth;
		let y = this.chessArea.getComponent(Widget).top + this.chessWidth * 3;
		if (j > -1) y = -this.chessWidth / 2 - j * this.chessWidth;
		else {
			let k = 0;
			this.insertX.forEach(e => {
				if (e == x) k++;
			})
			y += k * this.chessWidth;
			this.insertX.push(x);
		}
		let item = $.prefab(this.chess);
		item.name = 'chess' + String(colorIndex);
		item.attr({ color: colorIndex, i: i, j: j });
		item.getComponent(UITransform).setContentSize(size(this.chessWidth, this.chessWidth));
		item.getChildByName('Bg').getComponent(Sprite).spriteFrame = this.chessArray[colorIndex];
		item.position = v3(x, y);
		item.parent = this.chessArea;
		return item;
	}

	generateChess() {
		for (let j = this.heightNum - 1; j >= 0; j--) {
			for (let i = 0; i < this.widthNum; i++) {
				if (this.chesses[j][i] === null) {
					for (let y = j - 1; y >= 0; y--) {
						if (this.chesses[y][i] !== null) {
							this.chesses[j][i] = this.chesses[y][i];
							this.chesses[y][i] = null;
							this.chesses[j][i].attr({ i: i, j: j });
							tween(this.chesses[j][i])
								.to(0.1, { scale: v3(0.9, 0.9) })
								.to(0.3, { position: v3(this.chessWidth / 2 + i * this.chessWidth, -this.chessWidth / 2 - j * this.chessWidth) })
								.to(0.1, { scale: v3(1, 1) })
								.start();
							break;
						}
					}
				}
			}
		}
		for (let j = this.heightNum - 1; j >= 0; j--) {
			for (let i = 0; i < this.widthNum; i++) {
				if (this.chesses[j][i] === null) {
					this.chesses[j][i] = this.createChess($.random(0, this.chessArray.length - 1), i, -1);
					this.chesses[j][i].attr({ j: j });
					tween(this.chesses[j][i])
						.to(0.5, { position: v3(this.chessWidth / 2 + i * this.chessWidth, -this.chessWidth / 2 - j * this.chessWidth) })
						.start();
				}
			}
		}
		this.scheduleOnce(() => {
			this.insertX = [];
		}, 1.0);
	}

	touchChess(e: Touch) {
		let screenPos = e.getLocation(); //获取屏幕坐标
		let worldPos = this.camera.screenToWorld(v3(screenPos.x, screenPos.y)) //通过摄像机, 把屏幕坐标转为世界坐标
		let pos = this.chessArea.getComponent(UITransform).convertToNodeSpaceAR(worldPos); //把世界坐标转为节点相对原点的坐标
		pos.z = 0;
		this.chessArea.children.some(item => {
			let p = item.getPosition();
			if (rect(p.x - this.chessWidth / 2, p.y - this.chessWidth / 2, this.chessWidth, this.chessWidth).contains(v2(pos.x, pos.y))) {
				this.selectChess(item);
				return true;
			}
		});
	}

	selectChess(item) {
		this.unschedule(this.showHint);
		if (this.curHints.length) {
			this.curHints.forEach(e => {
				if (!e.parent) return;
				let child = e.getChildByName('Bg');
				child.getComponent(Animation).stop();
				child.setScale(v3(1, 1));
			});
			this.curHints = [];
		}
		let colorIndex = parseInt(item['color']), i = parseInt(item['i']), j = parseInt(item['j']);
		if (this.colorIndex == colorIndex && this.curProp == 1) return;
		this.propBar.getChildByName('Tips').active = false;
		if (this.curProp == -1) {
			let chesses = this.unionChess({ color: colorIndex, i: i, j: j }, []);
			if (chesses.length < 2) return;
			this.playAudio('delete');
			if (chesses.length == 4) this.playAudio('good', true);
			if (chesses.length == 5) this.playAudio('great', true);
			if (chesses.length == 6) this.playAudio('excellent', true);
			if (chesses.length == 7) this.playAudio('amazing', true);
			if (chesses.length >= 8) this.playAudio('unbelievable', true);
			let seat = [];
			for (let k = 0; k < chesses.length; k++) {
				let chess = chesses[k];
				let colorIndex = parseInt(chess['color']), i = parseInt(chess['i']), j = parseInt(chess['j']);
				this.chesses[j][i] = null;
				seat.push({ color: colorIndex, i: i, j: j });
				chess.destroy();
			}
			this.stepNum--;
			this.stepLebel.string = String(this.stepNum);
			this.scheduleOnce(() => this.generateChess(), 0.1);
			this.countdownHint();
			this.checkTarget(seat);
		} else {
			switch (this.curProp) {
				case 0: {
					let target = this.chesses[j][i], color = target['color'];
					target.destroy();
					this.chesses[j][i] = null;
					this.scheduleOnce(() => this.generateChess(), 0.1);
					this.checkTarget([{ color: color }]);
					break;
				}
				case 1: {
					this.chesses[j][i].destroy();
					this.chesses[j][i] = this.createChess(this.colorIndex, i, j);
					break;
				}
				case 4: {
					this.playAudio('bomb');
					let chesses = [item];
					if (i > 0) {
						chesses.push(this.chesses[j][i - 1]);
						if (j > 0) chesses.push(this.chesses[j - 1][i - 1]);
					}
					if (i < this.widthNum - 1) {
						chesses.push(this.chesses[j][i + 1]);
						if (j < this.heightNum - 1) chesses.push(this.chesses[j + 1][i + 1]);
					}
					if (j > 0) {
						chesses.push(this.chesses[j - 1][i]);
						if (i < this.widthNum - 1) chesses.push(this.chesses[j - 1][i + 1]);
					}
					if (j < this.heightNum - 1) {
						chesses.push(this.chesses[j + 1][i]);
						if (i > 0) chesses.push(this.chesses[j + 1][i - 1]);
					}
					let seat = [];
					for (let k = 0; k < chesses.length; k++) {
						let chess = chesses[k];
						let colorIndex = parseInt(chess['color']), i = parseInt(chess['i']), j = parseInt(chess['j']);
						this.chesses[j][i] = null;
						seat.push({ color: colorIndex, i: i, j: j });
						chess.destroy();
					}
					this.scheduleOnce(() => this.generateChess(), 0.1);
					this.checkTarget(seat);
					break;
				}
			}
			this.propNum[this.curProp] -= 1;
			$.storage(STORAGE_KEY.PROP_NUM, JSON.stringify(this.propNum));
			this.setPropNum();
			this.countdownHint();
			this.curProp = -1;
		}
		if ($.inArray(this.curProp, [1, 3]) == -1) {
			let worldPos = this.chessArea.getComponent(UITransform).convertToWorldSpaceAR(v3(this.chessWidth / 2 + i * this.chessWidth, -this.chessWidth / 2 - j * this.chessWidth));
			let item = $.prefab(this.chessEffectArray[colorIndex]);
			item.position = this.chessArea.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
			item.parent = this.chessArea.parent;
		}
		if (this.stepNum <= 0) {
			this.unschedule(this.showHint);
			this.playAudio('lose');
			this.showLostLayer();
		}
	}

	checkTarget(chesses) {
		let isWin = true;
		this.target.forEach(item => {
			let label = item.getChildByName('Label').getComponent(Label);
			let count = parseInt(label.string);
			chesses.some(chess => {
				if (chess['color'] == item['color']) {
					count--;
					if (count < 0) count = 0;
					label.string = String(count);
					if (count == 0) return true;
				}
			});
			if (count > 0) isWin = false;
		});
		if (isWin) {
			this.unschedule(this.showHint);
			if (this.levelIndex < Level.length - 1) $.storage(STORAGE_KEY.GAME_LEVEL, this.levelIndex + 1);
			this.playAudio('win');
			this.showWinLayer();
		}
	}

	selectColor(e, data) {
		this.playAudio('click2');
		this.colorIndex = parseInt(data);
		this.changeColor();
	}
	changeColor() {
		let tipsView = this.propBar.getChildByName('Tips');
		for (let i = 0; i < 5; i++) {
			tipsView.getChildByPath('Text/change/chess' + i + '/Mark').active = false;
		}
		tipsView.getChildByPath('Text/change/chess' + this.colorIndex + '/Mark').active = true;
	}

	togglePropTips(e, index) {
		this.curProp = -1;
		let tipsView = this.propBar.getChildByName('Tips');
		if (typeof index == 'undefined') {
			this.playAudio('click');
			tipsView.active = false;
		} else {
			this.playAudio('click2');
			index = parseInt(index)
			if (this.propNum[index] <= 0) {
				//看广告
				WXManager.instance.showVideoAd(() => {
					this.propNum[index] += 1;
					$.storage(STORAGE_KEY.PROP_NUM, JSON.stringify(this.propNum));
					this.setPropNum();
				}, () => {
					//视频播放中断
				});
				return;
			}
			this.curProp = index;
			tipsView.getChildByPath('Text/delete').active = false;
			tipsView.getChildByPath('Text/change').active = false;
			tipsView.getChildByPath('Text/pause').active = false;
			tipsView.getChildByPath('Text/bomb').active = false;
			if (index == 3) {
				this.propNum[index] -= 1;
				$.storage(STORAGE_KEY.PROP_NUM, JSON.stringify(this.propNum));
				this.setPropNum();
				this.curProp = -1;
				this.setChessArea();
			} else {
				tipsView.active = true;
				switch (index) {
					case 0:
						tipsView.getChildByPath('Text/delete').active = true;
						break;
					case 1:
						this.changeColor();
						tipsView.getChildByPath('Text/change').active = true;
						break;
					case 2:
						tipsView.getChildByPath('Text/pause').active = true;
						this.playAudio('timer');
						break;
					case 4:
						tipsView.getChildByPath('Text/bomb').active = true;
						break;
				}
			}
		}
	}

	toggleSetting(e, data) {
		if (this.settingLayer.active) {
			this.playAudio('click');
			this.settingLayer.active = false;
		} else {
			this.playAudio('click2');
			this.settingLayer.active = true;
			this.settingLayer.getChildByPath('Board/Button').active = !data;
			this.settingLayer.getChildByPath('Board/Button/Bgm').getComponent(Sprite).spriteFrame = this.bgmIcons[this.isBgm];
			this.settingLayer.getChildByPath('Board/Button/Audio').getComponent(Sprite).spriteFrame = this.audioIcons[this.isAudio];
			this.settingLayer.getChildByPath('Board/Button2').active = !!data;
			this.settingLayer.getChildByPath('Board/Button2/Bgm').getComponent(Sprite).spriteFrame = this.bgmIcons[this.isBgm];
			this.settingLayer.getChildByPath('Board/Button2/Audio').getComponent(Sprite).spriteFrame = this.audioIcons[this.isAudio];
		}
	}

	showWinLayer() {
		this.winLayer.active = true;
	}

	showLostLayer() {
		this.lostLayer.active = true;
	}

	toggleRank() {
		if (this.rankLayer.active) {
			this.playAudio('click');
			this.rankLayer.active = false;
			this.menuLayer.active = true;
		} else {
			this.playAudio('click2');
			if (!$.apiUrl.length) return;
			WXManager.instance.showInterstitialAd();
			$.get('rank').then(json => {
				this.rankLayer.active = true;
				this.menuLayer.active = false;
			});
		}
	}

	share() {
		WXManager.instance.activeShare();
	}
}


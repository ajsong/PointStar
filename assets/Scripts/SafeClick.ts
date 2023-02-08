import { _decorator, Component, Node, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SafeClick')
export class SafeClick extends Component {
	@property({ tooltip: '按钮保护时间，指定间隔内只能点击一次' })
	safeTime = 0.5;

	start() {
		let button = this.getComponent(Button);
		if (!button || !button.interactable) return;

		let clickEvents = button.clickEvents;

		this.node.on('click', () => {
			button.clickEvents = [];
			this.scheduleOnce(dt => {
				button.clickEvents = clickEvents;
			}, this.safeTime);

			// 下面这种方式会导致快速点击按钮时触摸穿透（按钮禁用时不再接受触摸事件）
			// let autoGrey = button.enableAutoGrayEffect;
			// button.enableAutoGrayEffect = false;
			// button.interactable = false;
			// this.scheduleOnce(dt => {
			//     button.enableAutoGrayEffect = autoGrey;
			//     button.interactable = true;
			// }, this.safeTime);
		}, this);
	}
}


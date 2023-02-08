import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { GameManager } from "./GameManager"

@ccclass('Chess')
export class Chess extends Component {

	gameManager: GameManager;

	start() {

	}

	onClick() {
		this.gameManager.selectChess(this.node);
	}
}


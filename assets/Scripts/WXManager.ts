export default class WXManager {
	public static _instance: WXManager = null;

	public static get instance() {
		if (null == this._instance) {
			this._instance = new WXManager();
		}
		return this._instance;
	}

	shareMsg: string = '好可惜，就差一点点，可以帮我过关么？'
	// 激励视频
	videoId: string = 'adunit-3b6004cfe10d059e'
	private videoAd = null
	// 插屏
	interstitialId: string = 'adunit-8180df7a6585d4b5'
	private interstitialAd = null
	// 横幅
	bannerId: string = 'adunit-9581feadefae7b83'
	private bannerAd = null

	// 获取用户信息
	getUser(callback: Function, options?: { desc?: string, text?: string, style?: {} }) {
		if (typeof wx === 'undefined') {
			console.log('【获取用户信息】仅支持小程序平台')
			return;
		}
		wx.getSetting({
			success: res => {
				if (typeof options.desc === 'undefined') options.desc = '用于完善会员信息';
				if (typeof options.text === 'undefined') options.text = '获取用户信息';
				if (res.authSetting['scope.userInfo']) {
					wx.getUserProfile({
						desc: options.desc, // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
						success: res => {
							callback(res.userInfo);
						}
					});
				} else {
					//console.log('用户没有授权');
					let style = {
						left: 0,
						top: 0,
						width: 200,
						height: 40,
						lineHeight: 40,
						backgroundColor: '#ff0000',
						//backgroundColor: 'rgba(0,0,0,0)',
						color: '#ffffff',
						textAlign: 'center',
						fontSize: 16,
						borderRadius: 4
					};
					if (Object.keys(options.style).length) {
						for (let key in options.style) style[key] = options.style[key];
					}
					let button = wx.createUserInfoButton({
						type: 'text',
						text: options.text,
						style: style
					});
					button.onTap(res => {
						callback(res.userInfo);
						button.hide();
					});
				}
			}
		})
	}

	// 主动分享
	activeShare(success?: any, fail?: any) {
		if (typeof wx === 'undefined') {
			console.log('【主动分享】仅支持小程序平台')
			return
		}
		wx.shareAppMessage({
			title: this.shareMsg,
			success() {
				if (success) success();
			},
			fail() {
				if (fail) fail();
			}
		});
	}

	// 被动分享
	passiveShare(success?: any, fail?: any) {
		if (typeof wx === 'undefined') {
			console.log('【被动分享】仅支持小程序平台')
			return
		}
		wx.showShareMenu({
			success: (res: any) => { },
			fail: (res: any) => { }
		});
		wx.onShareAppMessage(() => {
			return {
				title: this.shareMsg,
				success() {
					if (success) success();
				},
				fail() {
					if (fail) fail();
				}
			}
		});
	}

	// 跳转
	turnToApp(appId: string) {
		if (typeof wx === 'undefined') {
			console.log('【程序跳转】仅支持小程序平台', appId)
			return
		}
		wx.navigateToMiniProgram({
			appId: appId
		});
	}

	// 初始化横幅
	initBannerAd() {
		if (typeof wx === 'undefined') {
			console.log('【流量主横幅初始化】仅支持小程序平台')
			return
		}
		if (this.bannerId == '') {
			console.log('【流量主】请配置横幅广告ID')
			return
		}
		if (this.bannerAd == null) {
			let winSize = wx.getSystemInfoSync();
			this.bannerAd = wx.createBannerAd({
				adUnitId: this.bannerId,
				adIntervals: 10,
				style: {
					height: winSize.windowHeight - 80,
					left: 0,
					top: 500,
					width: winSize.windowWidth
				}
			});
			this.bannerAd.onResize((res: any) => {
				this.bannerAd.style.top = winSize.windowHeight - this.bannerAd.style.realHeight;
				this.bannerAd.style.left = winSize.windowWidth / 2 - this.bannerAd.style.realWidth / 2;
			});
			this.bannerAd.onError((err: any) => {
				console.error('【流量主横幅】初始化有误')
			});
		}
	}

	// 横幅展示
	toggleBannerAd(isShow: boolean) {
		if (typeof wx === 'undefined') {
			console.log('【流量主横幅】仅支持小程序平台')
			return
		}
		if (this.bannerAd) {
			isShow ? this.bannerAd.show() : this.bannerAd.hide();
		}
	}

	// 初始化插屏
	initInterstitialAd() {
		if (typeof wx === 'undefined') {
			console.log('【流量主插屏初始化】仅支持小程序平台')
			return
		}
		if (this.interstitialId == '') {
			console.log('【流量主】请配置插屏广告ID')
			return
		}
		if (this.interstitialAd == null) {
			this.interstitialAd = wx.createInterstitialAd({
				adUnitId: this.interstitialId
			});
			this.interstitialAd.onError((err: any) => {
				console.error('【流量主插屏】初始化有误')
			});
		}
	}

	// 插屏展示
	showInterstitialAd() {
		if (typeof wx === 'undefined') {
			console.log('【流量主插屏】仅支持小程序平台')
			return
		}
		if (this.interstitialAd) {
			this.interstitialAd.show().catch((err: any) => {
				console.error('【流量主插屏】加载失败')
			});
		}
	}

	// 初始化激励视频
	initVideoAd() {
		if (typeof wx === 'undefined') {
			console.log('【流量主激励视频初始化】仅支持小程序平台')
			return
		}
		if (this.videoId == '') {
			console.log('【流量主】请配置激励视频广告ID')
			return
		}
		if (this.videoAd == null) {
			this.videoAd = wx.createRewardedVideoAd({
				adUnitId: this.videoId
			});
			this.videoAd.onError((err: any) => {
				console.error('【流量主激励视频】初始化有误')
			});
		}
	}

	// 激励视频展示
	showVideoAd(success: any, fail?: any) {
		if (typeof wx === 'undefined') {
			console.log('激励视频模拟成功1')
			return success && success()
		}
		if (this.videoAd) {
			this.videoAd.offClose();
			this.videoAd.onClose((res: any) => {
				this.videoAd.offClose();
				if (res && res.isEnded || res === undefined) {
					return success && success()
				} else {
					return fail && fail()
				}
			});
			this.videoAd.show().catch(() => {
				this.videoAd.load()
					.then(() => this.videoAd.show())
					.catch((err: any) => {
						console.log('广告展示失败')
					})
			});
		} else {
			console.log('激励视频模拟成功2')
			return success && success()
		}
	}
}


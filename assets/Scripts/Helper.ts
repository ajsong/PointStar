/*
Developed by @mario 1.0.20221214
*/
import * as cc from 'cc';

//API接口域名
const _apiUrl = ''

//请求全局参数
const requestConfig = {
	get() { //全局接口追加get参数
		return {}
	},
	post() { //全局接口追加post参数
		return {}
	},
	header() { //全局接口追加header
		/* const LOCALE_CODE = new Map([
			['zh-Hans', 1],
			['zh-Hant', 2],
			['en', 3],
		])
		let lang = LOCALE_CODE.get(uni.getLocale()) */
		return {
			//'Accept-Language': uni.getLocale()
		}
	},
	returnJson: true, //全局返回数据必须为json
}

const $ = {
	//网络请求
	ajax(method, url, data?, success?, error?, returnJson?) {
		method = method.toUpperCase()
		if (this.isPlainObject(data)) data = this.param(data);
		let requestGet = requestConfig.get();
		let requestPost = requestConfig.post();
		let requestHeader = requestConfig.header();
		if (!/^https?:\/\//.test(url)) url = _apiUrl + '/' + this.trim(url, '/');
		if (Object.keys(requestGet).length) {
			url += (url.includes('?') ? '&' : '?') + Object.entries(requestGet).map(item => item.join('=')).join('&');
		}
		if (Object.keys(requestPost).length) {
			if (!data) data = {};
			let postData = {};
			for (let key in requestPost) postData[key] = requestPost[key];
			for (let key in data) postData[key] = data[key];
			data = postData;
		}
		let async = method === 'GET';
		if (async && data) url += (url.indexOf('?') > -1 ? '&' : '?') + data;
		let header = {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'X-Requested-With': 'XMLHttpRequest',
		};
		if (method === 'JSON') {
			method = 'POST';
			header['Content-Type'] = 'application/json; charset=UTF-8';
		}
		if (Object.keys(requestHeader).length) {
			for (let key in requestHeader) header[key] = requestHeader[key];
		}
		if (typeof wx !== 'undefined') {
			return wx.request({
				url: url,
				data: data,
				header: header,
				method: method,
				dataType: 'text',
				responseType: 'text',
				success: res => {
					let json = res.data;
					if (this.isJsonString(json)) {
						json = JSON.parse(String(json));
						if (typeof json['code'] !== 'undefined' && typeof json['msg'] !== 'undefined') {
							if (json['code'] !== 0) {
								if (error) error(json['msg']);
								return;
							}
						}
					} else if (requestConfig.returnJson || returnJson) {
						console.log(json)
						if (error) error(json)
						return;
					}
					if (success) success(json)
				},
				fail: res => {
					if (error) error(res);
				}
			});
		}
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = () => {
				if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
					let json = xhr.responseText;
					if (this.isJsonString(json)) {
						json = JSON.parse(json);
						if (typeof json['code'] !== 'undefined' && typeof json['msg'] !== 'undefined') {
							if (json['code'] !== 0) {
								if (error) error(json['msg']);
								return;
							}
						}
					} else if (requestConfig.returnJson || returnJson) {
						console.log(json)
						if (error) error(json)
						else reject(json)
						return;
					}
					if (success) success(json)
					else resolve(json)
				} else {
					if (error) error();
					else reject()
				}
			};
			xhr.open(method, url, async);
			for (let key in header) xhr.setRequestHeader(key, header[key]);
			if (async) xhr.send();
			else xhr.send(data);
		});
	},
	get(url, data?, success?, error?, returnJson?) {
		if (typeof data !== 'undefined') {
			if (typeof data === 'string') {
				url += (url.includes('?') ? '&' : '?') + data
			} else if (this.isPlainObject(data) && Object.keys(data).length) {
				url += (url.includes('?') ? '&' : '?') + this.param(data)
			} else if (this.isFunction(data)) {
				returnJson = error
				error = success
				success = data
			} else if (typeof data === 'boolean') {
				returnJson = data
				error = null
				success = null
			}
		}
		return this.ajax('GET', url, null, success, error, returnJson)
	},
	post(url, data?, success?, error?, returnJson?) {
		if (typeof success === 'boolean') {
			returnJson = success
			error = null
			success = null
		}
		if (typeof error === 'boolean') {
			returnJson = error
			error = null
		}
		return this.ajax('POST', url, data, success, error, returnJson)
	},
	postJSON(url, data?, success?, error?, returnJson?) {
		if (typeof success === 'boolean') {
			returnJson = success
			error = null
			success = null
		}
		if (typeof error === 'boolean') {
			returnJson = error
			error = null
		}
		return this.ajax('JSON', url, data, success, error, returnJson)
	},
	//对象转url参数
	param(data) {
		if (this.isPlainObject(data)) {
			var query = [];
			for (var key in data) query.push(key + '=' + data[key]);
			return query.join('&');
		}
		return data;
	},
	//清除首尾指定字符串
	trim(str, separate) {
		if (str.length) {
			if (typeof (separate) === 'undefined') {
				return str.replace(/^\s+|\s+$/, '');
			} else if (separate.length) {
				let re = new RegExp('^(' + separate + ')+|(' + separate + ')+$');
				return str.replace(re, '');
			}
		}
		return '';
	},
	//保留n位小数
	round(str, num) {
		return this.numberFormat(str, num);
	},
	numberFormat(str, num) {
		if (typeof (num) === 'undefined') num = 2;
		return parseFloat(str).toFixed(num);
	},
	//金额样式, 每三位加逗号
	amountFormat(num) {
		return num.toString().replace(/\d+/, function (n) {
			return n.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
		});
	},
	//精确加法, arguments[2]要保留的小数位数(可以不传此参数,如不传则不处理小数位数)
	bcadd(num, arg) {
		let r1 = num.toString(), r2 = arg.toString(), m, result, d = arguments[2];
		let r1Arr = r1.split('.'), r2Arr = r2.split('.'), d1 = r1Arr.length === 2 ? r1Arr[1] : '', d2 = r2Arr.length === 2 ? r2Arr[1] : '';
		let len = Math.max(d1.length, d2.length);
		m = Math.pow(10, len);
		result = Number(((r1 * m + r2 * m) / m).toFixed(len));
		return (typeof d !== 'number') ? Number(result) : Number(result.toFixed(parseInt(String(d))));
	},
	//精确减法
	bcsub(num, arg) {
		return this.bcadd(num, -Number(arg), arguments[2]);
	},
	//精确乘法
	bcmul(num, arg) {
		let r1 = num.toString(), r2 = arg.toString(), m, result, d = arguments[2];
		m = (r1.split('.')[1] ? r1.split('.')[1].length : 0) + (r2.split('.')[1] ? r2.split('.')[1].length : 0);
		result = (Number(r1.replace('.', '')) * Number(r2.replace('.', ''))) / Math.pow(10, m);
		return (typeof d !== 'number') ? Number(result) : Number(result.toFixed(parseInt(String(d))));
	},
	//精确除法
	bcdiv(num, arg) {
		let r1 = num.toString(), r2 = arg.toString(), m, result, d = arguments[2];
		m = (r2.split('.')[1] ? r2.split('.')[1].length : 0) - (r1.split('.')[1] ? r1.split('.')[1].length : 0);
		result = (Number(r1.replace('.', '')) / Number(r2.replace('.', ''))) * Math.pow(10, m);
		return (typeof d !== 'number') ? Number(result) : Number(result.toFixed(parseInt(String(d))));
	},
	//字符串转小写
	lower(str) {
		if (!String(str).length) return '';
		return str.toLowerCase();
	},
	//字符串转大写
	upper(str) {
		if (!String(str).length) return '';
		return str.toUpperCase();
	},
	//对网址编码
	urlencode(url) {
		url = String(url);
		if (!url.length) return '';
		return encodeURIComponent(url).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
	},
	//对网址解密
	urldecode(url) {
		url = String(url);
		if (!url.length) return '';
		url = url.replace(/%25/g, '%').replace(/%21/g, '!').replace(/%27/g, "'").replace(/%28/g, '(').replace(/%29/g, ')').replace(/%2A/g, '*');
		return decodeURIComponent(url);
	},
	//是否在数组里
	inArray(obj, arrayObj) {
		let index = -1;
		if (arrayObj && (arrayObj instanceof Array) && arrayObj.length) {
			for (let i = 0; i < arrayObj.length; i++) {
				if (obj === arrayObj[i]) {
					index = i;
					break;
				}
			}
		}
		return index;
	},
	//是否数组
	isArray(obj) {
		if (!obj) return false;
		return (obj instanceof Array);
	},
	//是否数字字面量
	isPlainObject(obj) {
		if (!obj) return false;
		return obj && typeof (obj) === 'object' && Object.prototype.toString.call(obj).toLowerCase() === '[object object]';

	},
	//是否空对象
	isEmptyObject: function (obj) {
		return JSON.stringify(obj) === '{}';
	},
	//是否函数
	isFunction(func) {
		if (!func) return false;
		return (func instanceof Function);
	},
	//是否数字
	isNumber(str) {
		return !isNaN(str);
	},
	//是否中文
	isCN(str) {
		return /^[\u4e00-\u9fa5]+$/.test(str);
	},
	//是否固话
	isTel(str) {
		return /^((\d{3,4}-)?\d{8}(-\d+)?|(\(\d{3,4}\))?\d{8}(-\d+)?)$/.test(str);
	},
	//是否手机
	isMobile(str) {
		return /^(\+?86)?1[3-8]\d{9}$/.test(str);
	},
	//是否邮箱
	isEmail(str) {
		return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(str);
	},
	//是否日期字符串
	isDate(str) {
		return /^(?:(?!0000)\d{4}[\/-](?:(?:0?[1-9]|1[0-2])[\/-](?:0?[1-9]|1\d|2[0-8])|(?:0?[13-9]|1[0-2])[\/-](?:29|30)|(?:0?[13578]|1[02])[\/-]31)|(?:\d{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)[\/-]0?2[\/-]29)$/.test(str);
	},
	//是否身份证(严格)
	isIdCard(str) {
		let Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1], //加权因子
			ValideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; //身份证验证位值,10代表X
		function idCardValidate(idCard) {
			if (idCard.length === 15) {
				return is15IdCard(idCard); //进行15位身份证的验证
			} else if (idCard.length === 18) {
				return is18IdCard(idCard) && isTrue18IdCard(idCard.split('')); //进行18位身份证的基本验证和第18位的验证
			} else {
				return false;
			}
		}
		function isTrue18IdCard(idCard) {
			let sum = 0;
			if (idCard[17].toLowerCase() === 'x') idCard[17] = 10; //将最后位为x的验证码替换为10方便后续操作
			for (let i = 0; i < 17; i++) sum += Wi[i] * idCard[i]; //加权求和
			let valCodePosition = sum % 11; //得到验证码所位置
			return idCard[17] === ValideCode[valCodePosition];
		}
		function is18IdCard(idCard) {
			let year = idCard.substring(6, 10),
				month = idCard.substring(10, 12),
				day = idCard.substring(12, 14),
				date = new Date(year, parseInt(month) - 1, parseInt(day));
			return !(date.getFullYear() !== parseInt(year) || date.getMonth() !== parseInt(month) - 1 || date.getDate() !== parseInt(day));
		}
		function is15IdCard(idCard) {
			let year = idCard.substring(6, 8),
				month = idCard.substring(8, 10),
				day = idCard.substring(10, 12),
				date = new Date(year, parseInt(month) - 1, parseInt(day));
			return !(date.getFullYear() - 1900 !== parseInt(year) || date.getMonth() !== parseInt(month) - 1 || date.getDate() !== parseInt(day));
		}
		return idCardValidate(str);
	},
	//检测是否JSON对象
	isJson(obj) {
		return this.isPlainObject(obj);
	},
	//检测是否JSON字符串
	isJsonString(str) {
		if (this.isJson(str)) return true;
		let ret = null;
		try {
			ret = JSON.parse(str);
		} catch (e) { }
		return ret !== null;
	},
	//JSON字符串转JSON对象
	json(str) {
		if (this.isJson(str)) return str;
		let res = null;
		try {
			res = JSON.parse(str);
		} catch (e) { }
		return res;
	},
	//JSON对象转JSON字符串
	jsonString(obj) {
		if (!this.isJsonString(obj)) return '';
		if (typeof obj === 'string') return obj;
		return JSON.stringify(obj);
	},
	//使用对象扩展另一个对象
	extend() {
		let args = null;
		if (this.isArray(arguments[0])) {
			args = this.clone(arguments[0]);
			if (!this.isArray(args)) args = [];
			for (let i = 1; i < arguments.length; i++) {
				if (!this.isArray(arguments[i])) continue;
				args = args.concat(this.clone(arguments[i]));
			}
		} else {
			args = this.clone(arguments[0]);
			if (!this.isPlainObject(args)) args = {};
			for (let i = 1; i < arguments.length; i++) {
				if (!this.isPlainObject(arguments[i])) continue;
				for (let key in arguments[i]) {
					args[key] = this.clone(arguments[i][key]);
				}
			}
		}
		return args;
	},
	//数组循环
	each(arr, callback) {
		if (!this.isFunction(callback)) return this;
		if (this.isArray(arr)) {
			for (let i = 0; i < arr.length; i++) {
				let res = callback.call(arr[i], i, arr[i]);
				if (typeof (res) === 'boolean') {
					if (!res) break;
				}
			}
		} else if (this.isPlainObject(arr)) {
			for (let key in arr) {
				let res = callback.call(arr[key], key, arr[key]);
				if (typeof (res) === 'boolean') {
					if (!res) break;
				}
			}
		} else {
			callback.call(arr, 0, arr);
		}
		return this;
	},
	//克隆对象或数组
	clone(obj) {
		if (!obj) return obj;
		if (obj instanceof Date) {
			return new Date(obj.valueOf());
		} else if (obj instanceof Array) {
			let newArr = [];
			for (let i = 0; i < obj.length; i++) {
				newArr.push(this.clone(obj[i]));
			}
			return newArr;
		} else if (obj && typeof (obj) === 'object' && Object.prototype.toString.call(obj).toLowerCase() === '[object object]') {
			let newObj = {};
			for (let key in obj) {
				newObj[key] = this.clone(obj[key]);
			}
			return newObj;
		}
		return obj;
	},
	//填充前导零
	fillZero(num, prec = 2) {
		return (Array(prec).join('0') + '' + String(num)).slice(-prec);
	},
	//随机指定范围内整数(支持小数)
	random(minNum: number, maxNum?: number, decimalNum?: number) {
		let min = 0, max = 0;
		minNum <= maxNum ? (min = minNum, max = maxNum) : (min = maxNum, max = minNum);
		switch (arguments.length) {
			case 1:
				return Math.floor(Math.random() * minNum + 1);
			case 2:
				return Math.floor(Math.random() * (max - min + 1) + min);
			case 3:
				return Number((Math.random() * (max - min) + min).toFixed(decimalNum));
			default:
				return Math.random();
		}
	},
	//浏览器本地存储, time:单位天,默认一天
	//$.storage(); 返回window.localStorage
	//$.storage('key'); 获取
	//$.storage('key', 'data'); 设置
	//$.storage('key', 'data', 1/24); 设置,过期时间为1小时
	//$.storage('key', null); 删除
	//$.storage(null); 删除所有
	storage(key, data?: any, time?: number) {
		if (key === null) {
			if (typeof wx !== 'undefined') {
				wx.clearStorageSync();
			} else if (window.localStorage) {
				for (let i = 0; i < window.localStorage.length; i++) {
					if ((window.localStorage.key(i).split('_') || [''])[0] === 'storage') {
						window.localStorage.removeItem(window.localStorage.key(i));
					}
				}
			}
			return this;
		}
		key = { data: 'storage_data_' + encodeURIComponent(key), time: 'storage_time_' + encodeURIComponent(key) };
		if (typeof data === 'undefined') {
			if (typeof wx !== 'undefined') {
				return wx.getStorageSync(key.data);
			}
			data = window.localStorage.getItem(key.data);
			if (data) {
				if (Number(window.localStorage.getItem(key.time)) > (new Date()).getTime()) {
					//data = $.json(data);
					return data;
				} else {
					window.localStorage.removeItem(key.data);
					window.localStorage.removeItem(key.time);
				}
			}
			return null;
		} else if (data === null) {
			if (typeof wx !== 'undefined') {
				wx.removeStorageSync(key.data);
				wx.removeStorageSync(key.time);
			} else {
				window.localStorage.removeItem(key.data);
				window.localStorage.removeItem(key.time);
			}
		} else {
			if (typeof time === 'undefined') time = 1;
			time = (new Date()).getTime() + Number(time) * 24 * 60 * 60 * 1000;
			if (typeof data !== 'string') data = JSON.stringify(data);
			if (typeof wx !== 'undefined') {
				wx.setStorageSync(key.data, data);
				wx.setStorageSync(key.time, String(time));
			} else {
				window.localStorage.setItem(key.data, data);
				window.localStorage.setItem(key.time, String(time));
			}
		}
		return this;
	},
	storageJSON(key) {
		let data = this.storage(key)
		if (!data) return null;
		return JSON.parse(data);
	},
	//清除本地存储
	clearStorage() {
		return this.storage(null);
	},
	//设置cookie
	cookie(key, data, expires) {
		if (typeof (data) === 'undefined') {
			let reg = new RegExp('(^| )' + key + '=([^;]*)(;|$)'), arr = document.cookie.match(reg);
			if (arr) {
				return decodeURIComponent(arr[2]);
			} else {
				return null;
			}
		} else if (data === false || data === null) {
			if (!this.isArray(key)) key = [key];
			for (let i in key) document.cookie = key[i] + '=; max-age=0';
		} else {
			if (!this.isArray(key)) key = [key];
			for (let i in key) {
				let cookie = key[i] + '=' + encodeURIComponent(typeof data === 'string' ? data : JSON.stringify(data));
				if (expires && !isNaN(expires)) cookie += '; max-age=' + (expires * 24 * 60 * 60);
				document.cookie = cookie;
			}
		}
		return this;
	},
	cookieJSON(key) {
		let data = this.cookie(key)
		if (!data) return null;
		return JSON.parse(data);
	},
	//base64
	base64() {
		let BASE64_MAPPING = [
			'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
			'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
			'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
			'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
			'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
			'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
			'w', 'x', 'y', 'z', '0', '1', '2', '3',
			'4', '5', '6', '7', '8', '9', '+', '/'
		];
		let URLSAFE_BASE64_MAPPING = [
			'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
			'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
			'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
			'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
			'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
			'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
			'w', 'x', 'y', 'z', '0', '1', '2', '3',
			'4', '5', '6', '7', '8', '9', '-', '_'
		];
		let _toBinary = function (ascii) {
			let binary = [];
			while (ascii > 0) {
				let b = ascii % 2;
				ascii = Math.floor(ascii / 2);
				binary.push(b);
			}
			binary.reverse();
			return binary;
		};
		let _toDecimal = function (binary) {
			let dec = 0;
			let p = 0;
			for (let i = binary.length - 1; i >= 0; --i) {
				let b = binary[i];
				if (b === 1) {
					dec += Math.pow(2, p);
				}
				++p;
			}
			return dec;
		};
		let _toUTF8Binary = function (c, binaryArray) {
			let mustLen = (8 - (c + 1)) + ((c - 1) * 6);
			let fatLen = binaryArray.length;
			let diff = mustLen - fatLen;
			while (--diff >= 0) {
				binaryArray.unshift(0);
			}
			let binary = [];
			let _c = c;
			while (--_c >= 0) {
				binary.push(1);
			}
			binary.push(0);
			let i = 0, len = 8 - (c + 1);
			for (; i < len; ++i) {
				binary.push(binaryArray[i]);
			}
			for (let j = 0; j < c - 1; ++j) {
				binary.push(1);
				binary.push(0);
				let sum = 6;
				while (--sum >= 0) {
					binary.push(binaryArray[i++]);
				}
			}
			return binary;
		};
		let _toBinaryArray = function (str) {
			let binaryArray = [];
			for (let i = 0, len = str.length; i < len; ++i) {
				let unicode = str.charCodeAt(i);
				let _tmpBinary = _toBinary(unicode);
				if (unicode < 0x80) {
					let _tmpdiff = 8 - _tmpBinary.length;
					while (--_tmpdiff >= 0) {
						_tmpBinary.unshift(0);
					}
					binaryArray = binaryArray.concat(_tmpBinary);
				} else if (unicode >= 0x80 && unicode <= 0x7FF) {
					binaryArray = binaryArray.concat(_toUTF8Binary(2, _tmpBinary));
				} else if (unicode >= 0x800 && unicode <= 0xFFFF) {//UTF-8 3byte
					binaryArray = binaryArray.concat(_toUTF8Binary(3, _tmpBinary));
				} else if (unicode >= 0x10000 && unicode <= 0x1FFFFF) {//UTF-8 4byte
					binaryArray = binaryArray.concat(_toUTF8Binary(4, _tmpBinary));
				} else if (unicode >= 0x200000 && unicode <= 0x3FFFFFF) {//UTF-8 5byte
					binaryArray = binaryArray.concat(_toUTF8Binary(5, _tmpBinary));
				} else if (unicode >= 4000000 && unicode <= 0x7FFFFFFF) {//UTF-8 6byte
					binaryArray = binaryArray.concat(_toUTF8Binary(6, _tmpBinary));
				}
			}
			return binaryArray;
		};
		let _toUnicodeStr = function (binaryArray) {
			let unicode;
			let unicodeBinary = [];
			let str = "";
			for (let i = 0, len = binaryArray.length; i < len;) {
				if (binaryArray[i] === 0) {
					unicode = _toDecimal(binaryArray.slice(i, i + 8));
					str += String.fromCharCode(unicode);
					i += 8;
				} else {
					let sum = 0;
					while (i < len) {
						if (binaryArray[i] === 1) {
							++sum;
						} else {
							break;
						}
						++i;
					}
					unicodeBinary = unicodeBinary.concat(binaryArray.slice(i + 1, i + 8 - sum));
					i += 8 - sum;
					while (sum > 1) {
						unicodeBinary = unicodeBinary.concat(binaryArray.slice(i + 2, i + 8));
						i += 8;
						--sum;
					}
					unicode = _toDecimal(unicodeBinary);
					str += String.fromCharCode(unicode);
					unicodeBinary = [];
				}
			}
			return str;
		};
		let _encode = function (str, url_safe) {
			let base64_Index = [];
			let binaryArray = _toBinaryArray(str);
			let dictionary = url_safe ? URLSAFE_BASE64_MAPPING : BASE64_MAPPING;
			let extra_Zero_Count = 0;
			for (let i = 0, len = binaryArray.length; i < len; i += 6) {
				let diff = (i + 6) - len;
				if (diff === 2) {
					extra_Zero_Count = 2;
				} else if (diff === 4) {
					extra_Zero_Count = 4;
				}
				let _tmpExtra_Zero_Count = extra_Zero_Count;
				while (--_tmpExtra_Zero_Count >= 0) {
					binaryArray.push(0);
				}
				base64_Index.push(_toDecimal(binaryArray.slice(i, i + 6)));
			}
			let base64 = '';
			for (let i = 0, len = base64_Index.length; i < len; ++i) {
				base64 += dictionary[base64_Index[i]];
			}
			for (let i = 0, len = extra_Zero_Count / 2; i < len; ++i) {
				base64 += '=';
			}
			return base64;
		};
		let _decode = function (_base64Str, url_safe) {
			let _len = _base64Str.length;
			let extra_Zero_Count = 0;
			let dictionary = url_safe ? URLSAFE_BASE64_MAPPING : BASE64_MAPPING;
			if (_base64Str.charAt(_len - 1) === '=') {
				if (_base64Str.charAt(_len - 2) === '=') {//两个等号说明补了4个0
					extra_Zero_Count = 4;
					_base64Str = _base64Str.substring(0, _len - 2);
				} else {//一个等号说明补了2个0
					extra_Zero_Count = 2;
					_base64Str = _base64Str.substring(0, _len - 1);
				}
			}
			let binaryArray = [];
			for (let i = 0, len = _base64Str.length; i < len; ++i) {
				let c = _base64Str.charAt(i);
				for (let j = 0, size = dictionary.length; j < size; ++j) {
					if (c === dictionary[j]) {
						let _tmp = _toBinary(j);
						/*不足6位的补0*/
						let _tmpLen = _tmp.length;
						if (6 - _tmpLen > 0) {
							for (let k = 6 - _tmpLen; k > 0; --k) {
								_tmp.unshift(0);
							}
						}
						binaryArray = binaryArray.concat(_tmp);
						break;
					}
				}
			}
			if (extra_Zero_Count > 0) {
				binaryArray = binaryArray.slice(0, binaryArray.length - extra_Zero_Count);
			}
			let str = _toUnicodeStr(binaryArray);
			return str;
		};
		return {
			encode: function (str) {
				return _encode(str, false);
			},
			decode: function (base64Str) {
				return _decode(base64Str, false);
			}
		};
	},
	//md5加密
	md5(str) {
		let hexcase = 0; let chrsz = 8; function hex_md5(s) { return binl2hex(core_md5(str2binl(s), s.length * chrsz)) } function core_md5(x, len) { x[len >> 5] |= 0x80 << ((len) % 32); x[(((len + 64) >>> 9) << 4) + 14] = len; let a = 1732584193; let b = -271733879; let c = -1732584194; let d = 271733878; for (let i = 0; i < x.length; i += 16) { let olda = a; let oldb = b; let oldc = c; let oldd = d; a = md5_ff(a, b, c, d, x[i], 7, -680876936); d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586); c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819); b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330); a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897); d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426); c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341); b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983); a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416); d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417); c = md5_ff(c, d, a, b, x[i + 10], 17, -42063); b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162); a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682); d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101); c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290); b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329); a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510); d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632); c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713); b = md5_gg(b, c, d, a, x[i], 20, -373897302); a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691); d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083); c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335); b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848); a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438); d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690); c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961); b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501); a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467); d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784); c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473); b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734); a = md5_hh(a, b, c, d, x[i + 5], 4, -378558); d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463); c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562); b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556); a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060); d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353); c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632); b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640); a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174); d = md5_hh(d, a, b, c, x[i], 11, -358537222); c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979); b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189); a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487); d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835); c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520); b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651); a = md5_ii(a, b, c, d, x[i], 6, -198630844); d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415); c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905); b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055); a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571); d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606); c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523); b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799); a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359); d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744); c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380); b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649); a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070); d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379); c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259); b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551); a = safe_add(a, olda); b = safe_add(b, oldb); c = safe_add(c, oldc); d = safe_add(d, oldd) } return Array(a, b, c, d) } function md5_cmn(q, a, b, x, s, t) { return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b) } function md5_ff(a, b, c, d, x, s, t) { return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t) } function md5_gg(a, b, c, d, x, s, t) { return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t) } function md5_hh(a, b, c, d, x, s, t) { return md5_cmn(b ^ c ^ d, a, b, x, s, t) } function md5_ii(a, b, c, d, x, s, t) { return md5_cmn(c ^ (b | (~d)), a, b, x, s, t) } function safe_add(x, y) { let lsw = (x & 0xFFFF) + (y & 0xFFFF); let msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF) } function bit_rol(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)) } function str2binl(str) { let bin = Array(); let mask = (1 << chrsz) - 1; for (let i = 0; i < str.length * chrsz; i += chrsz)bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (i % 32); return bin } function binl2hex(binarray) { let hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef'; let str = ""; for (let i = 0; i < binarray.length * 4; i++) { str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF) } return str } return hex_md5(str);
	},
	//时间戳转日期字符串
	formatDate(timestamp, formatStr, callback) {
		let date = new Date(timestamp * 1000);
		let format = formatStr ? formatStr : 'yyyy-mm-dd hh:nn:ss',
			monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			monthFullName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			weekName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			weekFullName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
			monthNameCn = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
			monthFullNameCn = monthNameCn,
			weekNameCn = ['日', '一', '二', '三', '四', '五', '六'],
			weekFullNameCn = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
			getYearWeek = function (y, m, d) {
				let dat = new Date(y, m, d), firstDay = new Date(y, 0, 1),
					day = Math.round((dat.valueOf() - firstDay.valueOf()) / 86400000);
				return Math.ceil((day + ((firstDay.getDay() + 1) - 1)) / 7);
			},
			year = date.getFullYear() + '', month = (date.getMonth() + 1) + '', day = date.getDate() + '', week = date.getDay(),
			hour = date.getHours() + '', minute = date.getMinutes() + '', second = date.getSeconds() + '',
			yearWeek = getYearWeek(date.getFullYear(), date.getMonth(), date.getDate()) + '';
		format = format.replace(/yyyy/g, year);
		format = format.replace(/yy/g, ((date.getFullYear() - 1900) % 100) > 9 ? ((date.getFullYear() - 1900) % 100) + '' : '0' + ((date.getFullYear() - 1900) % 100));
		format = format.replace(/Y/g, year);
		format = format.replace(/mme/g, monthFullName[parseInt(month) - 1]);
		format = format.replace(/me/g, monthName[parseInt(month) - 1]);
		format = format.replace(/mmc/g, monthFullNameCn[parseInt(month) - 1]);
		format = format.replace(/mc/g, monthNameCn[parseInt(month) - 1]);
		format = format.replace(/mm/g, this.prefixZero(month));
		format = format.replace(/m/g, month);
		format = format.replace(/dd/g, this.prefixZero(day));
		format = format.replace(/d/g, day);
		format = format.replace(/hh/g, this.prefixZero(hour));
		format = format.replace(/h/g, hour);
		format = format.replace(/H/g, this.prefixZero(hour));
		format = format.replace(/G/g, hour);
		format = format.replace(/nn/g, this.prefixZero(minute));
		format = format.replace(/n/g, minute);
		format = format.replace(/ii/g, this.prefixZero(minute));
		format = format.replace(/i/g, minute);
		format = format.replace(/ss/g, this.prefixZero(second));
		format = format.replace(/s/g, second);
		format = format.replace(/wwe/g, weekFullName[week]);
		format = format.replace(/we/g, weekName[week]);
		format = format.replace(/ww/g, weekFullNameCn[week]);
		format = format.replace(/w/g, weekNameCn[week]);
		format = format.replace(/WW/g, this.prefixZero(yearWeek));
		format = format.replace(/W/g, yearWeek);
		format = format.replace(/a/g, parseInt(hour) < 12 ? 'am' : 'pm');
		format = format.replace(/A/g, parseInt(hour) < 12 ? 'AM' : 'PM');
		if ($.isFunction(callback)) callback.call(date, { year: year, month: month, day: day, hour: hour, minute: minute, second: second, week: week });
		return format;
	},
	//秒转分秒微秒
	secondConversion(second, len = 3) {
		let m = parseInt(String(second / 60));
		let s = parseInt(String(second % 60));
		let ms = parseInt(String(second * 1000 % 1000));
		if (len == 2) {
			return this.fillZero(m) + "'" + this.fillZero(s);
		} else {
			return this.fillZero(m) + "'" + this.fillZero(s) + "'" + this.fillZero(ms, 3);
		}
	},
	//显示toast
	toast(text: string = '', { duration = 0.3, delay = 3.0, fontsize = 30, color = cc.color(255, 255, 255, 255), bgcolor = cc.color(0, 0, 0, 150) } = {}) {
		// Canvas
		let canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);
		let canvasSize = canvas.getComponent(cc.UITransform).contentSize;

		// 节点
		let bgNode = new cc.Node();
		bgNode.layer = cc.Layers.Enum.UI_2D;

		// Lable文本格式设置
		let textNode = new cc.Node();
		textNode.layer = cc.Layers.Enum.UI_2D;
		let textLabel = textNode.addComponent(cc.Label);
		textLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
		textLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
		textLabel.fontSize = fontsize;
		textLabel.color = color;
		textLabel.string = text;

		// 当文本宽度过长时，设置为自动换行格式
		let size = cc.size(0, 0);
		if (text.length * textLabel.fontSize > (canvasSize.width * 3) / 5) {
			size.width = (canvasSize.width * 3) / 5;
			textLabel.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
		} else {
			size.width = text.length * textLabel.fontSize;
		}
		let lineCount = ~~((text.length * textLabel.fontSize) / ((canvasSize.width * 3) / 5)) + 1;
		size.height = textLabel.fontSize * lineCount;
		textNode.getComponent(cc.UITransform).setContentSize(size);

		// 背景设置
		let ctx = bgNode.addComponent(cc.Graphics);
		ctx.arc(-size.width / 2, 0, size.height / 2 + 20, 0.5 * Math.PI, 1.5 * Math.PI, true);
		ctx.lineTo(size.width / 2, -(size.height / 2 + 20));
		ctx.arc(size.width / 2, 0, size.height / 2 + 20, 1.5 * Math.PI, 0.5 * Math.PI, true);
		ctx.lineTo(-size.width / 2, size.height / 2 + 20);
		ctx.fillColor = bgcolor;
		ctx.fill();

		bgNode.setPosition(cc.v3(0, canvasSize.height / 2 + size.height));
		bgNode.addChild(textNode);
		canvas.node.addChild(bgNode);

		// 执行动画
		cc.tween(bgNode)
			.to(duration, { position: cc.v3(0, 0) })
			.call(() => {
				cc.tween(bgNode)
					.delay(delay)
					.to(duration, { position: cc.v3(0, -canvasSize.height / 2 - size.height) })
					.call(() => {
						bgNode.destroy();
					})
					.start();
			})
			.start();
	},
	//屏幕大小
	window() {
		return cc.screen.windowSize;
	},
	//设计大小
	designSize() {
		return cc.view.getVisibleSize();
	},
	//屏幕物理大小
	screenSize() {
		let ratio = cc.screen.devicePixelRatio;
		let size = cc.screen.windowSize;
		return cc.size(size.width / ratio, size.height / ratio);
	},
	//初始化预载体
	prefab(item: cc.Prefab) {
		return cc.instantiate(item);
	},
	//物理系统调试
	physicsDebug(debug) {
		if (debug) {
			cc.PhysicsSystem2D.instance.debugDrawFlags = cc.EPhysics2DDrawFlags.All;
		} else {
			cc.PhysicsSystem2D.instance.debugDrawFlags = cc.EPhysics2DDrawFlags.None;
		}
	},
	//获取小游戏胶囊按钮位置
	getMenuButton(target: cc.Node, autoWidget?: boolean) {
		if (typeof wx === 'undefined') {
			//console.log('【获取小游戏胶囊按钮位置】仅支持小程序平台');
			return 0;
		}
		let menu = wx.getMenuButtonBoundingClientRect();
		let systemInfo = wx.getSystemInfoSync();
		let menuHeight = systemInfo.statusBarHeight > 44 ? menu.top : menu.height;
		let paddingTop = cc.screen.windowSize.height * (menuHeight / systemInfo.windowHeight);
		if (autoWidget) {
			let widget = target.getComponent(cc.Widget);
			if (!widget) widget = target.addComponent(cc.Widget);
			if (!target['widgetTop']) target.attr({ widgetTop: widget.top });
			else widget.top = target['widgetTop'];
			if (systemInfo.statusBarHeight > 44) widget.top += systemInfo.statusBarHeight;
			else widget.top = paddingTop;
			widget.isAlignTop = true; //顶部对齐
			widget.isAbsoluteTop = true; //以像素作为边距
			widget.updateAlignment();
		}
		return paddingTop;
	},
}

export default {
	...$,
	apiUrl: _apiUrl,
	data: {}
}

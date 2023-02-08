// 方块种类: 0 红色 1 绿色 2 蓝色 3 黄色 4 紫色
export const Level = [
	{
		step: 5,
		target: [
			{ type: 0, num: 2 },
			{ type: 1, num: 2 },
			{ type: 3, num: 2 }
		],
		widthNum: 10,
		heightNum: 10,
		loop: false
	},
	{
		step: 10,
		target: [
			{ type: 1, num: 10 },
			{ type: 2, num: 10 },
			{ type: 3, num: 10 },
		],
		widthNum: 10,
		heightNum: 10,
		loop: true
	},
	{
		step: 20,
		target: [
			{ type: 0, num: 20 },
			{ type: 2, num: 20 },
			{ type: 4, num: 20 },
		],
		widthNum: 10,
		heightNum: 10,
		loop: true
	},
	{
		step: 20,
		target: [
			{ type: 0, num: 20 },
			{ type: 2, num: 20 },
			{ type: 1, num: 20 },
			{ type: 3, num: 20 },
		],
		widthNum: 10,
		heightNum: 10,
		loop: true
	},
	{
		step: 30,
		target: [
			{ type: 4, num: 50 },
			{ type: 0, num: 30 },
			{ type: 2, num: 50 },
			{ type: 1, num: 30 },
		],
		widthNum: 10,
		heightNum: 10,
		loop: true
	},
	{
		step: 50,
		target: [
			{ type: 3, num: 50 },
			{ type: 4, num: 80 },
			{ type: 1, num: 100 },
			{ type: 0, num: 60 },
		],
		widthNum: 10,
		heightNum: 10,
		loop: true
	},
	{
		step: 80,
		target: [
			{ type: 3, num: 160 },
			{ type: 4, num: 120 },
			{ type: 1, num: 110 },
			{ type: 0, num: 150 },
		],
		widthNum: 10,
		heightNum: 10,
		loop: true
	},
	{
		step: 100,
		target: [
			{ type: 3, num: 200 },
			{ type: 4, num: 250 },
			{ type: 1, num: 220 },
			{ type: 0, num: 180 },
		],
		widthNum: 10,
		heightNum: 10,
		loop: true
	}
]

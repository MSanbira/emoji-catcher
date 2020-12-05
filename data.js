
const EmojiCatcherSavedDataTemplate = {
	emojis: [],
	points: 0,
	achievements: [],
	stats: {
		avgTimeToClick: 0,
		lastSecClick: 0,
		firstSecClick: 0,
		emojiMissed: 0,
	}
}

const EmojiCatcherData = {
	bugEmoji: {
		emoji: '🐛',
		chance: 0,
		title: 'You found a bug, consider reporting :]',
		points: 1
	},
	emojis: [
		{
			emoji: '🐛',
			chance: 0,
			title: 'You found a bug, consider reporting :]',
			points: 1,
			rareStatus: 'Rare'
		},
		{
			emoji: '🦄',
			chance: 500,
			title: 'The Majestic',
			points: 10,
			rareStatus: 'Rare'
		},
		{
			emoji: '🍪',
			chance: 400,
			title: 'Clicker',
			points: 10,
			rareStatus: 'Rare'
		},
		{
			emoji: '😀',
			chance: 90,
			title: 'OG',
			points: 50,
			rareStatus: 'Rare'
		},
		{
			emoji: '😎',
			chance: 8,
			title: 'Coooool',
			points: 100,
			rareStatus: 'Rare'
		},
		{
			emoji: '💸',
			chance: 1,
			title: 'Cha-Ching',
			points: 10000,
			rareStatus: 'Rare'
		},
		{
			emoji: '👑',
			chance: 1,
			title: 'Royalty',
			points: 10000,
			rareStatus: 'Rare'
		}
	],
	achievements: [
		{
			condition: {
				check: 'points',
				for: 100
			},
			text: 'On the board: winning 100 points',
			icon: '🥉'
		},
		{
			condition: {
				check: 'emojis',
				type: '🍪',
				for: 10
			},
			text: 'Master-baker: collecting 10 cookies',
			icon: '🍪'
		},
		{
			condition: {
				check: 'types',
				for: 10
			},
			text: 'Slowly but surely: collecting 10 different types',
			icon: '☝️'
		}
	]
}
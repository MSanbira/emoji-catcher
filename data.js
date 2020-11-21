const emojiCollectorData = {
	emojis: [
		{
			emoji: '🦄',
			chance: 100,
			title: 'The Majestic'
		}
	],
	achievements: [
		{
			condition: {
				check: 'points',
				for: 100
			},
			text: 'On the board: winnig 100 points',
			icon: '🥉'
		},
		{
			condition: {
				check: 'emoji',
				type: '🍪'
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
			text: 'Slowly but surely: collecting 10 diffrent types',
			icon: '☝️'
		}
	]
}
var utils = require('./utils');

module.exports = {
	// Runs cronic function
	runCronFunctions: function (pool, guild, discord) {
		// Calculates time to run time functions
		var nextDate = new Date();
		if (nextDate.getMinutes() === 0) {
			callEveryMinute();
		} else {
			if (nextDate.getHours() >= 1) {
				nextDate.setHours(nextDate.getHours() + (24 - (nextDate.getHours() - 1)));
			} else {
				nextDate.setHours(1);
			}

			// Calls utils.logTopOfTheMonth and utils.logMostPlayedGamesOfTheDay every day
			nextDate = cleanDate(nextDate);
			var difference = nextDate - new Date();
			setTimeout(function() {
				callEveryDay(pool, guild, discord); // callEveryDay at 1AM UTC
			}, difference);

			// Call utils.logMemes every 12 hours
			nextDate = new Date();
			var hourDifference = nextDate.getHours() % 12;
			nextDate.setHours(nextDate.getHours() + (12 - hourDifference));
			nextDate = cleanDate(nextDate);
			var difference = nextDate - new Date();
			setTimeout(function() {
				callEveryTwelveHours(guild, discord);
			}, difference); // callEveryTwelveHours

			// Call utils.registerMostPlayedGames every hour
			nextDate = new Date();
			var hourDifference = nextDate.getHours() % 1;
			nextDate.setHours(nextDate.getHours() + (1 - hourDifference));
			nextDate = cleanDate(nextDate);
			var difference = nextDate - new Date();
			setTimeout(function() {
				callEveryHour(guild, discord);
			}, difference); // callEveryHour

			// Call utils.updateVoicePoints every minute
			nextDate = new Date();
			nextDate.setMinutes(nextDate.getMinutes() + 1);
			nextDate.setSeconds(0);
			difference = nextDate - new Date();
			setTimeout(function() {
				callEveryMinute(pool, guild); // callEveryMinute
			}, difference);
		}
	}
};

// Calls utils.logTopOfTheMonth every day
function callEveryDay(pool, guild, discord) {
	utils.logTopOfTheMonth(pool, guild, true, new discord.RichEmbed(), new discord.RichEmbed());
	utils.logMostPlayedGamesOfTheDay(guild, new discord.RichEmbed());
	setInterval(function() {
		utils.logTopOfTheMonth(pool, guild, true, new discord.RichEmbed(), new discord.RichEmbed());
		utils.logMostPlayedGamesOfTheDay(guild, new discord.RichEmbed());
	}, 1000 * 60 * 60 * 24);
}

// Calls utils.logMemes every 12 hours
function callEveryTwelveHours(guild, discord) {
	utils.logMemes(guild, new discord.RichEmbed());
	setInterval(function() {
		utils.logMemes(guild, new discord.RichEmbed());
	}, 1000 * 60 * 60 * 12);
}

// Calls utils.registerMostPlayedGames every hour
function callEveryHour(guild, discord) {
	utils.registerMostPlayedGames(guild, new discord.RichEmbed());
	setInterval(function() {
		utils.registerMostPlayedGames(guild, new discord.RichEmbed());
	}, 1000 * 60 * 60);
}

// Calls utils.updateVoicePoints every minute
function callEveryMinute(pool, guild) {
	utils.updateVoicePoints(pool, guild);
	setInterval(function() {
		utils.updateVoicePoints(pool, guild);
	}, 1000 * 60 * 1);
}

// Resets date minutes and seconds to zero
function cleanDate(date) {
	date.setMinutes(0);
	date.setSeconds(0);
	return date;
}
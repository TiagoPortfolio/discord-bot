var express = require("express");
var app = express();
var http = require("http"),
	utils = require("./utils"),
	config = require("./config"),
	cron = require("./cronFunctions");

// Discord
const Discord = require("discord.js");
const client = new Discord.Client();
const token = config.token;
guild = "";

// PostgreSQL
var pg = require("pg");
pg.defaults.ssl = true;
const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL
});

app.set("port", process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));

// views is directory for all template files
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.listen(app.get("port"), function() {
	console.log("Node app is running on port", app.get("port"));
});

// Send requests to the app every 9 minutes to keep it alive
// (Heroku app sleeps after 30 minutes of inactivity)
setInterval(function() {
	http.get(
		{
			host: "snax-bonobot.herokuapp.com",
			port: 80,
			path: "/"
		},
		function(res) {
			console.log("Got response: " + res.statusCode);
		}
	).on("error", function(e) {
		console.log("Got error: " + e.message);
	});
}, 9 * 60 * 1000);

app.get("/", function(request, response) {
	pool.query(
		"SELECT * FROM users ORDER BY week, messages_count DESC LIMIT 10;",
		[],
		(err, res) => {
			if (err) {
				console.log("Error on SELECT: " + err);
				response.send("Error: " + err);
			} else {
				response.render("pages/index", { results: res.rows });
			}
		}
	);
});

app.get("/member/:member", function(request, response, next) {
	let member = decodeURI(request.params.member);
	console.log(request.params);
	console.log(member);
	pool.query(
		"SELECT * FROM users WHERE LOWER(username) iLIKE $1;",
		[member],
		(err, res) => {
			if (err) {
				console.log("Error on SELECT: " + err);
				response.send("Error: " + err);
			} else if (res.rows.length !== 0) {
				response.render("pages/member", { results: res.rows });
			} else {
				// HTTP status 404: NotFound
				response.status(404).send("User not found");
			}
		}
	);
});

app.get("/fight/:battle_id", function(request, response, next) {
	let battleID = decodeURI(request.params.battle_id);
	console.log(request.params);
	console.log(battleID);
	pool.query(
		"SELECT * FROM snaxclub_battles WHERE battle_id = $1;",
		[battleID],
		(err, res) => {
			if (err) {
				console.log("Error on SELECT: " + err);
				response.send("Error: " + err);
			} else if (res.rows.length !== 0) {
				response.render("pages/fight", { results: res.rows });
			} else {
				// HTTP status 404: NotFound
				response.status(404).send("Fight not found");
			}
		}
	);
});

app.get("/snaxclub/:player_discord_id", function(request, response, next) {
	let player_discord_id = decodeURI(request.params.player_discord_id);
	pool.query(
		"SELECT * FROM snaxclub_players RIGHT JOIN users ON (discord_id = player_discord_id) WHERE player_discord_id = $1 LIMIT 1;",
		[player_discord_id],
		(err, res) => {
			if (err) {
				console.log("Error on SELECT: " + err);
				response.send("Error: " + err);
			} else if (res.rows.length !== 0) {
				response.render("pages/character", { character: res.rows });
			} else {
				// HTTP status 404: NotFound
				response.status(404).send("Character not found");
			}
		}
	);
});

app.get("/db", function(request, response) {
	pool.query(
		"SELECT * FROM users ORDER BY messages_count DESC;",
		[],
		(err, res) => {
			if (err) {
				console.log("Error on SELECT: " + err);
				response.send("Error: " + err);
			} else {
				response.render("pages/db", { results: res.rows });
			}
		}
	);
});

//Discord code start
//------------------

// Only be ready after fetching guild
client.on("ready", () => {
	client.user.setActivity("!snax help", {
		url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		type: "WATCHING"
	});
	guild = client.guilds.get("83034666034003968"); // Get SNAXKREW server
	while (guild == "" && !guild.available) {
		console.log("GUILD NOT AVAILABLE YET");
	}
	cron.runCronFunctions(pool, guild, Discord);
	console.log("Snax-Bonobot is ready!");
});

// Triggered by any message sent
client.on("message", message => {
	//If it is a command
	var cleanMessage = message.content.trim().toLowerCase(); // Removes whitespaces at the start and end

	//Ignore bot messages
	if (message.member !== null) {
		if (!message.member.user.bot) {
			if (cleanMessage.startsWith("!snax")) {
				var command = cleanMessage.substring(5);
				if (command.charAt(0) !== " ") {
					// Confirm if there is a whitespace
					message.reply(
						utils.createEmbed([
							":warning: Add a whitespace after ***!snax*** to run my commands :blush:"
						])
					);
				} else {
					//It is a valid command!
					command = command.trim(); // Clean again
					//If it is a stats command
					if (command.toLowerCase().startsWith("stats")) {
						// Stats command
						utils.processStatsCommand(
							message,
							command,
							pool,
							new Discord.RichEmbed()
						);
					} else if (command.toLowerCase().startsWith("profile")) {
						// Profile command
						utils.processProfileCommand(
							message,
							command,
							pool,
							guild,
							new Discord.RichEmbed()
						);
					} else if (command.toLowerCase().startsWith("help")) {
						// Help command
						utils.processHelpCommand(message, "all");
					} else if (
						config.sounds.indexOf(command) !== -1 ||
						command.indexOf("sounds") !== -1
					) {
						// Sound command
						utils.processSoundCommand(message, command);
					} else if (
						message.author.username == "Arctic Monkey" &&
						command.toLowerCase().startsWith("podium") &&
						message.channel.name === "snax-bonobot"
					) {
						//If it is a podium command
						utils.logTopOfTheMonth(
							pool,
							guild,
							false,
							new Discord.RichEmbed(),
							new Discord.RichEmbed()
						);
					} else if (
						message.author.username == "Arctic Monkey" &&
						command.toLowerCase().startsWith("meme") &&
						message.channel.name === "snax-bonobot"
					) {
						//If it is a meme command
						utils.logMemes(guild, new Discord.RichEmbed());
					} else if (command.toLowerCase().startsWith("club")) {
						// SNAX club command to get info
						utils.processSnaxClubCommand(
							message,
							command,
							pool,
							new Discord.RichEmbed()
						);
					} else {
						// Invalid command
						message.reply(
							utils.createEmbed([
								":warning: That is not a valid command... I think you need help (type: `!snax help`)"
							])
						);
					}
				}
			} else if (cleanMessage == ".dailies") {
				// Dailies command
				utils.processDailiesCommand(message, pool);
			} else if (cleanMessage.startsWith(".rep ")) {
				// Reputation command
				utils.processRepCommand(message, pool);
			} else if (cleanMessage.startsWith(".race")) {
				// Race command
				utils.raceGame(guild, message, Discord);
			} else if (cleanMessage.startsWith(".hangman")) {
				// Hangman command
				utils.hangmanGame(guild, message, Discord);
			} else if (cleanMessage.startsWith(".fight")) {
				// SNAX CLUB fight command
				utils.snaxClubGame(
					guild,
					message,
					Discord,
					new Discord.RichEmbed()
				);
			} else if (cleanMessage.startsWith(".stop")) {
				// Stop command
				utils.stopPlayingSound(message);
			} else if (cleanMessage.startsWith(".playing")) {
				// Playing command
				utils.processPlayingCommand(
					message,
					guild,
					new Discord.RichEmbed()
				);
			} else if (cleanMessage.startsWith(".")) {
				// Role command
				utils.processRoleCommand(message, guild);
			} else {
				// Register message stats
				utils.registerMessage(message, pool);
				utils.processMessageReaction(message);
			}
		}
	}
});

// Triggered when user joins or leaves a voice channel and when mutes or unmutes himself
client.on("voiceStateUpdate", (oldMember, newMember) => {
	var oldUserChannel = oldMember.voiceChannel;
	var newUserChannel = newMember.voiceChannel;
	var oldUserSelfMute = oldMember.selfMute;
	var newUserSelfMute = newMember.selfMute;
	var muteStateChanged = false;

	// Ignore bots
	if (oldMember.user.bot || newMember.user.bot) {
		return;
	}

	var date = new Date();
	var dateUTC = new Date(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		date.getUTCHours(),
		date.getUTCMinutes(),
		date.getUTCSeconds()
	);
	var queryParams = [
		newMember.user.id, // discordID
		newMember.user.username, // username
		newMember.user.discriminator, // discriminator
		newMember.user.displayAvatarURL.replace(
			"size=2048",
			"width=60&height=60"
		), // avatar
		0, // Default characters_count
		utils.getWeekOfYear(dateUTC), // week of the month
		dateUTC.toLocaleString("en-us", { year: "numeric" }) // Year
	];

	// User leaves voice channel or joins AFK channel or user switched mute state. Ignore mute state in AFK channel
	if (
		(oldUserSelfMute !== newUserSelfMute &&
			(oldUserChannel !== undefined &&
				oldUserChannel.guild.afkChannelID !== oldUserChannel.id)) ||
		((oldUserChannel !== undefined &&
			oldUserChannel.guild.afkChannelID !== oldUserChannel.id &&
			newUserChannel === undefined) ||
			(oldUserChannel !== undefined &&
				oldUserChannel.guild.afkChannelID !== oldUserChannel.id &&
				newUserChannel.guild.afkChannelID === newUserChannel.id))
	) {
		// Calculate seconds in voice channel and insert in database
		if (oldUserSelfMute !== newUserSelfMute) {
			muteStateChanged = !muteStateChanged;
		}

		// Update muted or unmuted timestamp
		if (muteStateChanged) {
			var params = queryParams.slice();
			pool.query(
				"INSERT INTO users (discord_id, username, discriminator, avatar, characters_count, week, year " +
					(newUserSelfMute
						? ", muted_timestamp "
						: ", unmuted_timestamp ") +
					") " +
					"VALUES ($1, $2, $3, $4, $5, $6, $7, timezone('utc'::text, now())) " +
					"ON CONFLICT (discord_id, week, year) DO UPDATE SET " +
					(newUserSelfMute
						? "muted_timestamp "
						: "unmuted_timestamp ") +
					"= timezone('utc'::text, now());",
				params,
				(err, res) => {
					if (err) {
						console.error(
							"Error committing transaction 1",
							err.stack
						);
						console.log(
							"INSERT INTO users (discord_id, username, discriminator, avatar, characters_count, week, year " +
								(newUserSelfMute
									? ", muted_timestamp "
									: ", unmuted_timestamp ") +
								") " +
								"VALUES ($1, $2, $3, $4, $5, $6, $7, timezone('utc'::text, now())) " +
								"ON CONFLICT (discord_id, week, year) DO UPDATE SET " +
								(newUserSelfMute
									? "muted_timestamp "
									: "unmuted_timestamp ") +
								"= timezone('utc'::text, now());"
						);
						console.log(params);
						console.log(newMember.user.username);
					}
				}
			);
		}

		pool.connect((err, client, done) => {
			const shouldAbort = err => {
				if (err) {
					console.error("Error in transaction", err.stack);
					console.log(newMember.user.username);
					client.query("ROLLBACK", err => {
						if (err) {
							console.error(
								"Error rolling back client",
								err.stack
							);
							console.log(newMember.user.username);
						}
						// Release the client back to the pool
						done();
					});
				}
				return !!err;
			};

			// Revert newUserSelfMute value if user changed mute state to register data from previous mute state
			// (if mute state changed from muted to unmuted we want to register data from muted which is not equal to newUserSelfMute)
			if (muteStateChanged) {
				newUserSelfMute = !newUserSelfMute;
			}

			client.query("BEGIN", err => {
				if (shouldAbort(err)) {
					return;
				}

				client.query(
					"SELECT " +
						(newUserSelfMute
							? " muted_timestamp::timestamp "
							: " unmuted_timestamp::timestamp ") +
						"FROM users WHERE discord_id = $1 AND " +
						(newUserSelfMute
							? " muted_timestamp "
							: " unmuted_timestamp ") +
						"IS NOT NULL ORDER BY (year, week) DESC LIMIT 1",
					[queryParams[0]],
					(err, res) => {
						if (shouldAbort(err)) {
							return;
						} else if (res.rows.length === 0) {
							console.log(
								"COULD NOT SELECT muted or unmuted timestamp from users"
							);
							console.log(newMember.user.username);
							var totalSeconds = 0;
						} else {
							var endTimestamp = res.rows[0];
							endTimestamp =
								(newUserSelfMute
									? endTimestamp.muted_timestamp
									: endTimestamp.unmuted_timestamp) + "";
							endTimestamp = new Date(endTimestamp);
							var totalSeconds = Math.floor(
								(dateUTC - endTimestamp) / 1000
							);

							if (totalSeconds < 0) {
								totalSeconds = 0;
							}
						}

						// Add total seconds in voice channel at the beginning of the array
						queryParams.push(totalSeconds);

						client.query(
							"INSERT INTO users (discord_id, username, discriminator, avatar, characters_count, week, year, " +
								(newUserSelfMute
									? "seconds_muted, muted_timestamp"
									: "seconds_unmuted, unmuted_timestamp") +
								") " +
								"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, timezone('utc'::text, now())) " +
								"ON CONFLICT (discord_id, week, year) DO UPDATE SET " +
								(newUserSelfMute
									? "seconds_muted = users.seconds_muted "
									: "seconds_unmuted = users.seconds_unmuted ") +
								" + $8, " +
								(newUserSelfMute
									? "muted_timestamp "
									: "unmuted_timestamp ") +
								"= timezone('utc'::text, now());",
							queryParams,
							(err, res) => {
								if (shouldAbort(err)) {
									return;
								}
								client.query("COMMIT", err => {
									if (err) {
										console.error(
											"Error committing transaction",
											err.stack
										);
										console.log(
											"INSERT INTO users (discord_id, username, discriminator, avatar, characters_count, week, year, " +
												(newUserSelfMute
													? "seconds_muted, muted_timestamp"
													: "seconds_unmuted, unmuted_timestamp") +
												") " +
												"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, timezone('utc'::text, now())) " +
												"ON CONFLICT (discord_id, week, year) DO UPDATE SET " +
												(newUserSelfMute
													? "seconds_muted = users.seconds_muted "
													: "seconds_unmuted = users.seconds_unmuted ") +
												" + $8, " +
												(newUserSelfMute
													? "muted_timestamp "
													: "unmuted_timestamp ") +
												"= timezone('utc'::text, now());"
										);
										console.log(queryParams);
									}
									done();
								});
							}
						);
					}
				);
			});
		});

		// User connects to a voice channel or joins a voice channel coming from AFK channel
	} else if (
		(oldUserChannel === undefined ||
			oldUserChannel.guild.afkChannelID === oldUserChannel.id) &&
		newUserChannel !== undefined &&
		newUserChannel.guild.afkChannelID !== newUserChannel.id
	) {
		pool.connect((err, client, done) => {
			const shouldAbort = err => {
				if (err) {
					console.error("Error in transaction", err.stack);
					console.log(newMember.user.username);
					client.query("ROLLBACK", err => {
						if (err) {
							console.error(
								"Error rolling back client",
								err.stack
							);
							console.log(newMember.user.username);
						}
						// Release the client back to the pool
						done();
					});
				}
				return !!err;
			};

			client.query("BEGIN", err => {
				if (shouldAbort(err)) {
					return;
				}

				client.query(
					"INSERT INTO users (discord_id, username, discriminator, avatar, characters_count, week, year " +
						(newUserSelfMute
							? ", muted_timestamp "
							: ", unmuted_timestamp ") +
						") " +
						"VALUES ($1, $2, $3, $4, $5, $6, $7, timezone('utc'::text, now())) " +
						"ON CONFLICT (discord_id, week, year) DO UPDATE SET " +
						(newUserSelfMute
							? "muted_timestamp "
							: "unmuted_timestamp ") +
						"= timezone('utc'::text, now());",
					queryParams,
					(err, res) => {
						if (shouldAbort(err)) {
							return;
						}

						client.query("COMMIT", err => {
							if (err) {
								console.error(
									"Error committing transaction",
									err.stack
								);
								console.log(
									"INSERT INTO users (discord_id, username, discriminator, avatar, characters_count, week, year " +
										(newUserSelfMute
											? ", muted_timestamp "
											: ", unmuted_timestamp ") +
										") " +
										"VALUES ($1, $2, $3, $4, $5, $6, $7, timezone('utc'::text, now())) " +
										"ON CONFLICT (discord_id, week, year) DO UPDATE SET " +
										(newUserSelfMute
											? "muted_timestamp "
											: "unmuted_timestamp ") +
										"= timezone('utc'::text, now());"
								);
								console.log(queryParams);
								console.log(newMember.user.username);
							}
							done();
						});
					}
				);
			});
		});
	}
});

// Insert new user in database
client.on("guildMemberAdd", member => {
	str = JSON.stringify(member.user, null, 4); // indented output.
	console.log("****** USER JOINED ******");
	console.log(str);
	console.log("****** USER JOINED ******");

	// Ban memebers that have url in username to avoid spam
	let urlRegex = new RegExp(
		/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
	);
	if (
		member.user.username.indexOf("(tag)") !== -1 ||
		member.user.username.indexOf("senseibin") !== -1 || // Spamming user
		member.user.username.match(urlRegex)
	) {
		member
			.ban(7)
			.then(() => {
				console.log(
					"***Banned " +
						member.user.username +
						" | BOT? " +
						member.user.bot +
						"***"
				);
			})
			.catch(console.error);
	} else {
		var date = new Date();
		var dateUTC = new Date(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds()
		);
		var queryParams = [
			member.user.id, // discordID
			member.user.username, // username
			member.user.discriminator, // discriminator
			0, // messages_count
			0, // valid_messages_count
			0, // characters_count
			utils.getWeekOfYear(dateUTC), // week of the year
			dateUTC.getFullYear(), // year
			member.user.displayAvatarURL.replace(
				"size=2048",
				"width=60&height=60"
			)
		];

		//Connect to database to upsert data about user number of messages and characters
		pool.query(
			"INSERT INTO users (discord_id, username, discriminator, messages_count, valid_messages_count, characters_count, week, year, avatar) " +
				"VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) " +
				"ON CONFLICT (discord_id, week, year) DO UPDATE SET " +
				"avatar = $7; ",
			queryParams,
			(err, res) => {
				if (err) {
					console.log(
						"Error on UPSERT data for registerMessage: " + err
					);
				}
			}
		);

		// Add Initiate role
		member.addRole("301249217488486410");

		const channel = guild.channels.find(
			channel => channel.name === "general-chat"
		);
		// Do nothing if the channel wasn't found on this server
		if (!channel) {
			return;
		}

		let richEmbed = new Discord.RichEmbed();

		richEmbed.setColor(0x0074e8);
		richEmbed.setTitle("Welcome " + member.user.username + "!");
		richEmbed.setDescription(
			"<@" +
				member.user.id +
				"> " +
				"just joined **SNAXKREW**!\nEverybody say hi :wave:\nYou begin your adventure in **SNAXKREW** with :beginner: **Initiate** role!\nMake sure you read *#welcome-and-rules* channel"
		);
		richEmbed.setThumbnail(
			member.user.displayAvatarURL.replace(
				"size=2048",
				"width=60&height=60"
			)
		);

		channel.send(richEmbed).catch(err => console.log(err));
	}
});

// Log members that left
client.on("guildMemberRemove", member => {
	str = JSON.stringify(member.user, null, 4); // indented output.
	console.log("****** USER LEFT ******");
	console.log(str);
	console.log("****** USER LEFT ******");

	const generalChannel = guild.channels.find(
		channel => channel.name === "general-chat"
	);
	const botChannel = guild.channels.find(
		channel => channel.name === "snax-bonobot"
	);

	// Do nothing if the channel wasn't found on this server
	if (!botChannel || !generalChannel) {
		return;
	}

	// Edit welcome message after user leaves the guild
	generalChannel
		.fetchMessages()
		.then(messages => {
			messages.filter(function(message) {
				if (typeof message.embeds[0] !== "undefined") {
					if (
						message.embeds[0].title ==
						"Welcome " + member.user.username + "!"
					) {
						let richEmbed = new Discord.RichEmbed();

						richEmbed.setColor(0x0074e8);
						richEmbed.setTitle(
							"Welcome " + member.user.username + "!"
						);
						richEmbed.setDescription(
							"Aaaaaaaannnnd he's gone :wave:\n" +
								":skull: R.I.P. " +
								member.joinedAt.getDate() +
								" " +
								member.joinedAt.toLocaleString("en-us", {
									month: "long"
								}) +
								" " +
								member.joinedAt.getFullYear() +
								" - " +
								date.getDate() +
								" " +
								date.toLocaleString("en-us", {
									month: "long"
								}) +
								" " +
								date.getFullYear()
						);
						richEmbed.setThumbnail(
							member.user.displayAvatarURL.replace(
								"size=2048",
								"width=60&height=60"
							)
						);

						message.edit(richEmbed);
					}
				}
			});
		})
		.catch(console.error);

	// Log user leaving in bot channel
	const date = new Date();
	const memberRole = utils.getMemberRole(member);
	const message =
		"**" +
		member.user.username +
		"**" +
		(!Object.keys(memberRole).length
			? " without any activity role "
			: " with **" +
			  memberRole.emoji +
			  memberRole.name +
			  "** as highest role ") +
		"just left the server! <:feelsbadman:284396022682222592>\n" +
		":skull: R.I.P. " +
		member.joinedAt.getDate() +
		" " +
		member.joinedAt.toLocaleString("en-us", { month: "long" }) +
		" " +
		member.joinedAt.getFullYear() +
		" - " +
		date.getDate() +
		" " +
		date.toLocaleString("en-us", { month: "long" }) +
		" " +
		date.getFullYear();
	botChannel.send(message);
});

// Log members that were banned
client.on("guildBanAdd", (guildWhereBanned, user) => {
	str = JSON.stringify(user, null, 4); // indented output.
	console.log("****** USER BANNED ******");
	console.log(str);
	console.log("****** USER BANNED ******");

	const botChannel = guild.channels.find(
		channel => channel.name === "snax-bonobot"
	);

	// Do nothing if the channel wasn't found on this server
	if (!botChannel) {
		return;
	}

	// Log user leaving in bot channel
	const message = ":hammer:** " + user.username + "** was banned!";
	botChannel.send(message);
});

// Check if user started streaming
client.on("presenceUpdate", (oldMember, newMember) => {
	if (
		newMember.presence.game !== null &&
		newMember.presence.game.streaming !== null
	) {
		if (
			oldMember.presence.game === null ||
			!oldMember.presence.game.streaming
		) {
			if (newMember.presence.game.streaming) {
				utils.logStreamMessage(
					guild,
					newMember,
					new Discord.RichEmbed()
				);
			}
		}
	}
});

client.on("error", error => {
	console.error(error);
});

client.login(token);

// pool
// .query(
// 	// "TRUNCATE users CASCADE;",
// 	// 'DROP TABLE users',
// 	[], (err, res) => {
// 		if (err) {
// 			console.log("Error on SELECT: " + err);
// 			res.send("Error: " + err);
// 		}
// });

// pool
// .query(
// 	'CREATE TABLE users (  discord_id bigint NOT NULL,  username varchar(40) NOT NULL,  discriminator smallint NOT NULL,  avatar text DEFAULT \'\' NOT NULL,  week smallint NOT NULL,  year smallint NOT NULL,  messages_count bigint default 1 NOT NULL,  valid_messages_count bigint default 1 NOT NULL,  characters_count bigint NOT NULL,  valid_characters_count bigint DEFAULT 0 NOT NULL,  seconds_muted bigint DEFAULT 0 NOT NULL,  seconds_unmuted bigint DEFAULT 0 NOT NULL,  muted_timestamp timestamp without time zone default NULL,  unmuted_timestamp timestamp without time zone default NULL,  timestamp timestamp without time zone default (now() at time zone \'utc\'),  PRIMARY KEY(discord_id, week, year));',
// 	[], (err, res) => {
// 		if (err) {
// 			console.log("Error on SELECT: " + err);
// 			res.send("Error: " + err);
// 		}
// });

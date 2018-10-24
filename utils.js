var fs = require('fs'),
	https = require('https'),
	request = require('request'),
	imgur = require('imgur'),
	images = require('images'),
	cheerio = require('cheerio'),
	config = require('./config');

module.exports = {
	createEmbed: createEmbed,

	processHelpCommand: processHelpCommand,

	getWeekOfYear: getWeekOfYear,

	// Processes sound command
	processSoundCommand: function (message, sound) {
		// Check if command was typed in #bonobot-bonanza channel
		if (message.channel.name !== 'bonobot-bonanza' && message.channel.name !== 'announcements' && message.channel.name !== 'snax-bonobot') {
		// if (message.channel.name !== 'snax-bonobot') {
			//Send error message
			message.reply(createEmbed(
				[':warning: Please run my sound commands in #bonobot-bonanza channel to avoid spam.']
			));
		} else {
			if (sound.indexOf('help') !== -1) {
				processHelpCommand(message, 'sounds');
				return;
			} else if (config.sounds.indexOf(sound) !== -1) {
		    	// Check if user is in a voice channel
		    	if (typeof message.member.voiceChannel !== "undefined") {
		    		var channel = message.member.voiceChannel;
	
			    	if (config.botAvailable) {
						//Join user channel and play sound
						channel.join().then(connection => {
							config.botAvailable = false;
							var dispatcher = connection.playFile('public/sound/' + sound + '.mp3');
							dispatcher.on('end', reason => {
								channel.leave();
								config.botAvailable = true;
							})
						}).catch(console.error);
					} else {
						message.reply(createEmbed(
							[':warning: I am currently busy playing another sound :notes:, please wait!']
						));	
					}
			  	} else {
					//Send random sound error message
					message.reply(createEmbed(
						config.soundErrorDescriptions
					));
		    	}
			}
		}
	},

	// Stop playing sound
	stopPlayingSound: function (message) {
		// Check if command was typed in #bonobot-bonanza channel
		if (message.channel.name !== 'bonobot-bonanza' && message.channel.name !== 'announcements' && message.channel.name !== 'snax-bonobot') {
		// if (message.channel.name !== 'snax-bonobot') {
			//Send error message
			message.reply(createEmbed(
				[':warning: Please run my commands in #bonobot-bonanza channel to avoid spam.']
			));
		} else {
	    	// Check if user is in a voice channel
	    	if (typeof message.member.voiceChannel !== "undefined") {
	    		var channel = message.member.voiceChannel;
		    	if (!config.botAvailable) {
					channel.leave();
					config.botAvailable = true;
				}
		  	}
	    	message.delete(1000);
		}
	},

	// Processes stats command
	// (!snax stats discordID||@mention||username all_time||month||week||last_week)
	processStatsCommand: function (message, command, pool, richEmbed) {
		var queryLabel = 'month'; // Default query label
		var queryParams = [];
		var query = '';
		var pointsType = '';
		var globalMembers = false;
		var top20 = false;
		
		// Removes 'stats' at the start and whitespaces at the start and end
		command = command.substring(5).trim();

		if (command.indexOf('help') !== -1) {
			if (message.channel.name === 'bonobot-bonanza' || message.channel.name === 'announcements' || message.channel.name === 'snax-bonobot') {
			// if (message.channel.name === 'snax-bonobot') {
				processHelpCommand(message, 'stats');
				return;
			}

			//Send error message
			message.reply(createEmbed(
				[':warning: Please run help commands in #bonobot-bonanza channel to avoid spam.']
			));
			return;
		}

		if (command.indexOf('global') !== -1) {
			globalMembers = true;
			command = command.replace('global', '').trim();
		}

		if (command.indexOf('top20') !== -1) {
			top20 = true;
			command = command.replace('top20', '').trim();
		}

		// Split paramsValues
		var paramsValues = command.split(' ');
		// First parameter has to be a query label or if empty uses default label (month)
		if (paramsValues.length !== 0) {
			if (paramsValues[0] !== -1) {
				if (['month', 'all_time', 'week', 'last_week'].indexOf(paramsValues[0]) !== -1) {
					queryLabel = paramsValues[0];
				} else if (['text', 'voice', 'dailies', 'rep'].indexOf(paramsValues[0]) !== -1) {
					pointsType = paramsValues[0];
				}
			}
			if (paramsValues[1] !== -1) {
				if (['month', 'all_time', 'week', 'last_week'].indexOf(paramsValues[1]) !== -1) {
					queryLabel = paramsValues[1];
				} else if (['text', 'voice', 'dailies', 'rep'].indexOf(paramsValues[1]) !== -1) {
					pointsType = paramsValues[1];
				}
			}
		}

		var query =
			'SELECT discord_id, username, SUM(valid_messages_count) as valid_messages_count, SUM(valid_characters_count) as valid_characters_count, ' +
			'SUM(seconds_muted) as seconds_muted, SUM(seconds_unmuted) as seconds_unmuted, SUM(voice_points) as voice_points, ' +
			'SUM(dailies) as dailies, SUM(reputation) as reputation ' +
			'FROM users WHERE';
		var queryParams = [];

		if (queryLabel === 'month') { // Month (last 4 weeks)
			var where = getLast4WeeksQuery();
			query += where + ' GROUP BY discord_id, username ';
		} else if (queryLabel === 'all_time') {
			queryParams.push(2017); // Year
			query += ' year >= $1 GROUP BY discord_id, username ';
		} else if (queryLabel === 'week') {
			queryParams.push(getWeekOfYear(new Date())); // Week
			query += ' week = $1 GROUP BY discord_id, username ';
		} else if (queryLabel === 'last_week') {
			queryParams.push((getWeekOfYear(new Date()) - 1 < 1 ? getISOWeeks(new Date().getFullYear()) : getWeekOfYear(new Date()) - 1)); // Last Week
			query += ' week = $1 GROUP BY discord_id, username ';
		}

		pool
		.query(query, queryParams, (err, res) => {
			if (err) {
				console.log(err);
				message.reply(createEmbed(
					[':boom: An error occurred!']
				));
			} else {
				if (res.rows.length === 0) {
					message.reply(createEmbed(
						[':x: No stats returned!']
					));
				} else {
					// Remove champion members from stats
					if (!globalMembers) {
						// Remove champion members from stats
						res.rows = res.rows.filter(function(user) {
							var member = guild.members.get(user.discord_id.toString());
							if (typeof member !== 'undefined') {
								var userRole = module.exports.getMemberRole(member);
								return (userRole.name != 'Champion' && userRole.name != 'Officer');
							}
							return false;
						});
					}

					// Iterate through users from query result and calculate points and sort array after
					if (pointsType != 'dailies' && pointsType != 'rep') {
						res.rows.forEach(function(user){
							if (pointsType == 'text') {
								user.points = calculateTextPoints(user.valid_messages_count, user.valid_characters_count, user.dailies);
							} else if (pointsType == 'voice') {
								user.points = calculateVoicePoints(user.seconds_unmuted, user.seconds_muted, user.voice_points, user.dailies);
							} else {
								user.points = parseInt(calculateTextPoints(user.valid_messages_count, user.valid_characters_count, user.dailies)) + parseInt(calculateVoicePoints(user.seconds_unmuted, user.seconds_muted, user.voice_points, user.dailies)) - user.dailies;
							}
						});

						// Order array by points descending
						res.rows.sort(function(a, b){
							return parseInt(b.points) - parseInt(a.points);
						});
					} else {
						if (pointsType == 'dailies') {
							// Order array by dailies descending
							res.rows.sort(function(a, b){
								return parseInt(b.dailies) - parseInt(a.dailies);
							});
						} else if (pointsType == 'rep') {
							// Order array by rep descending
							res.rows.sort(function(a, b){
								return parseInt(b.reputation) - parseInt(a.reputation);
							});
						}
					}

					if (top20) {
						res.rows = res.rows.slice(0, 20);
					} else {
						res.rows = res.rows.slice(0, 9);
					}

					var embed = createStatsEmbed(richEmbed, res.rows, queryLabel, pointsType);
					message.channel.send({
						embed
					});
				}
			}
		});
	},

    // Processes profile command (!snax profile all_time||month||week||last_week discordID||@mention||username)
	processProfileCommand: function (message, command, pool, guild, richEmbed) {
		var queryLabel = 'month' // Show month stats by default in profile (last 4 weeks)
		var params = {
			discordID: false,
			username: false
		};
		var discordID = '';
		var username = '';
		var member = '';
		var author = false;
		var firstProfile = false;

		// Removes 'profile' at the start and whitespaces at the start and end
		command = command.substring(7).trim();

		if (command.indexOf('help') !== -1) {
			if (message.channel.name === 'bonobot-bonanza' || message.channel.name === 'announcements' || message.channel.name === 'snax-bonobot') {
			// if (message.channel.name === 'snax-bonobot') {
				processHelpCommand(message, 'profile');
				return;
			}
			
			//Send error message
			message.reply(createEmbed(
				[':warning: Please run help commands in #bonobot-bonanza channel to avoid spam.']
			));
		} else if (command.startsWith('all_time')) {
			queryLabel = 'all_time';
			command = command.replace('all_time', '').trim();
		} else if (command.startsWith('month')) {
			queryLabel = 'month';
			command = command.replace('month', '').trim();
		} else if (command.startsWith('week')) {
			queryLabel = 'week';
			command = command.replace('week', '').trim();
		} else if (command.startsWith('last_week')) {
			queryLabel = 'last_week';
			command = command.replace('last_week', '').trim();
		}

		if (command !== '') {
			discordID = command;
			username = command;
		}

		// This block of code is to help to build the query
		// Display profile of message author
		if (typeof message.mentions.users.first() === 'undefined') { // No mention made
			if (command === '') {
				discordID = message.author.id;
				params['discordID'] = true;
				author = true;
			} // Confirm if discordID is really a number and search by discord_id or username
			else if (typeof parseInt(discordID) === 'number' && (parseInt(discordID) % 1) === 0) {
				params['discordID'] = true;
			} else { // It has to be a username
				params['username'] = true;
			}
		} else {
			discordID = message.mentions.users.first().id;
			params['discordID'] = true;
		}

		var query = 'SELECT discord_id, username, SUM(messages_count) as messages_count, SUM(valid_messages_count) as valid_messages_count, ' +
								'SUM(characters_count) as characters_count, SUM(valid_characters_count) as valid_characters_count, ' +
								'SUM(seconds_muted) as seconds_muted, SUM(seconds_unmuted) as seconds_unmuted, SUM(voice_points) as voice_points, ' +
								'SUM(dailies) as dailies, SUM(reputation) as reputation ' +
								'FROM users WHERE ';
		var queryParams = [];

		if (queryLabel === 'month') { // Month (last 4 weeks)
			var where = getLast4WeeksQuery();
			query += where;
		} else if (queryLabel === 'all_time') {
			queryParams.push(2017); // Year
			query += ' year >= $1 ';
		} else if (queryLabel === 'week') {
			queryParams.push(getWeekOfYear(new Date())); // Week
			query += ' week = $1 ';
		} else if (queryLabel === 'last_week') {
			var lastWeek = (getWeekOfYear(new Date()) - 1 < 1 ? getISOWeeks(new Date().getFullYear()) : getWeekOfYear(new Date()) - 1);
			queryParams.push(lastWeek); // Last Week
			query += ' week = $1 ';
		}

		if (params['discordID']) {
			queryParams.push(discordID);
			query += ' AND discord_id = ' + (queryLabel !== 'month' ? '$2' : '$1');
		} else if (params['username']) {
			queryParams.push(username);
			query += ' AND LOWER(username) iLIKE ' + (queryLabel !== 'month' ? '$2' : '$1');
		}

		query += ' GROUP BY discord_id, username ';

		console.log(query);
		pool.connect((err, client, done) => {
		  const shouldAbort = (err) => {
		    if (err) {
		      console.error('Error in profile transaction', err.stack);
		      client.query('ROLLBACK', (err) => {
		        if (err) {
		          console.error('Error rolling back client', err.stack);
		        }
		        // Release the client back to the pool
		        done();
		      });
		    }
		    return !!err;
		  }

		  client.query('BEGIN', (err) => {
		    if (shouldAbort(err)) {
		    	return;
		    }

		    client.query(query, queryParams, (err, res) => {
		      if (shouldAbort(err)) {
		      	message.reply(createEmbed(
		      		[':boom: An error occurred!']
		      	));
		      	return;
		      } else if (res.rows.length === 0) {
		      	if (author) {
		      		var user = {
		      			'username' : message.author.username,
		      			'avatar' : message.author.displayAvatarURL.replace('size=2048', 'width=60&height=60'),
		      			'messages_count' : 0,
		      			'valid_messages_count' : 0,
		      			'characters_count' : 0,
		      			'valid_characters_count' : 0,
		      			'seconds_unmuted' : 0,
		      			'seconds_muted' : 0,
		      			'member' : guild.members.get(message.author.id),
		      			'voice_points' : 0,
		      			'dailies' : 0,
		      			'reputation' : 0
		      		};
		      		var embed = createProfileEmbed(richEmbed, user, queryLabel);
	          	message.channel.send({
	          		embed
	          	}).catch(err => console.log(err));
	          	return;
		      	}
						message.reply(createEmbed(
							[':x: Profile not found for this user!']
						));
						return;
					} else {
						var user = res.rows[0];
						user['member'] = guild.members.get(user.discord_id); // Add member object
					}

					// Get latest user avatar
		      client.query(
			    	'SELECT avatar FROM users WHERE LOWER(username) iLIKE $1 ORDER BY (year, week) DESC LIMIT 1',
						[user.username], (err, res) => {
		        if (shouldAbort(err)) {
		        	return;
		        }	else if (res.rows.length !== 0) {
							user['avatar'] = res.rows[0].avatar;
						} else {
							user['avatar'] = '';
						}

          	var embed = createProfileEmbed(richEmbed, user, queryLabel);
          	message.channel.send({
          		embed
          	}).catch(err => console.log(err));

		        client.query('COMMIT', (err) => {
		          if (err) {
		            console.error('Error committing transaction', err.stack);
		          }
		          done();
		        });
		      });
		    });
	    });
		});
	},

	// Processes role command (.role_name)
	processRoleCommand: function (message, guild) {
		let newRole = message.content.trim().substring(1).toLowerCase();
		let member = message.member;

		if (config.availableRoles.indexOf(newRole) === -1) {
			return;
		}

		// Check if command was typed in #bonobot-bonanza channel
		if (message.channel.name === 'bonobot-bonanza' || message.channel.name === 'snax-bonobot') {

			if (!newRole.length) {
				return;
			}

			// Check if guild has this role
			let foundRole = guild.roles.find(role =>
				role.name.toLowerCase() == newRole
			);

			if (foundRole) {
				if (config.availableRoles.indexOf(newRole) === -1) {
					message.reply('you can\'t add **' + foundRole.name + '** role to yourself! :thinking:');
				} else {
					// Check if guild member already has this role
					let memberRole = member.roles.find(role =>
						role.name.toLowerCase() == newRole
					);

					if (memberRole) {
						message.reply('you already have **' + foundRole.name + '** role!');
					} else {
						member.addRole(foundRole);
						message.reply('you now have **' + foundRole.name + '** role!');
					}
				}
			}
		} else {
			message.reply(createEmbed(
				[':warning: Please run role commands in #bonobot-bonanza channel to avoid spam.']
			));
		}
	},

	// Processes dailies command
	processDailiesCommand: function (message, pool) {
		if (message.channel.name !== 'bonobot-bonanza' && message.channel.name !== 'snax-bonobot') {
			//Send error message
			message.reply(createEmbed(
				[':warning: Please run dailies command in #bonobot-bonanza channel to avoid spam.']
			));
			return;
		} else if (message.content.trim().indexOf('help') !== -1) {
			processHelpCommand(message, 'dailies');
			return;
		}

		var verifyTimestamp = true;
		var date = new Date();
		var dateUTC = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		var queryParams = [
			message.author.id, // discordID
			message.author.username, // username
			message.author.discriminator, // discriminator
			0, // characters_count
			getWeekOfYear(dateUTC), // week of the year
			dateUTC.getFullYear(), // year
			message.author.displayAvatarURL.replace('size=2048', 'width=60&height=60'), // avatar
		];
		var time = {
			'hours' : 0,
			'minutes' : 0,
			'seconds' : 0
		}

		pool.connect((err, client, done) => {
		  const shouldAbort = (err) => {
		    if (err) {
		      console.error('Error in profile transaction in dailies', err.stack);
		      client.query('ROLLBACK', (err) => {
		        if (err) {
		          console.error('Error rolling back client in dailies', err.stack);
		        }
		        // Release the client back to the pool
		        done();
		      });
		    }
		    return !!err;
		  }

		  client.query('BEGIN', (err) => {
		    if (shouldAbort(err)) {
		    	return;
		    }

		    client.query(
		    	'SELECT dailies_timestamp::timestamp ' +
		    	'FROM users WHERE discord_id = $1 AND dailies_timestamp ' +
		    	'IS NOT NULL ORDER BY (year, week) DESC LIMIT 1',
		    	[queryParams[0]], (err, res) => {
			      if (shouldAbort(err)) {
			      	message.reply(createEmbed(
			      		[':boom: An error occurred!']
			      	));
			      	return;
			      } else if (res.rows.length === 0) {
			      	verifyTimestamp = false;
						} else {
							// dailies_timestamp + 24 hours
							var dailiesTimestamp = new Date(new Date(res.rows[0].dailies_timestamp + '').getTime() + 60 * 60 * 24 * 1000);
							var totalSeconds = Math.floor((dailiesTimestamp - dateUTC) / 1000);
							time.hours = Math.floor(totalSeconds / 3600);
							totalSeconds -= (time.hours % 24) * 3600;
							time.minutes = Math.floor(totalSeconds / 60) % 60;
							totalSeconds -= time.minutes * 60;
							time.seconds = totalSeconds % 60;
						}

						if (verifyTimestamp && time.hours >= 0) {
							message.channel.send(
								'**<:snax:230458568497692673>  |  ' + message.author.username + ', your daily <:kfc:296050563374776320> SNAX points refreshes in ' +
								time.hours + (time.hours != 1 ? ' hours' : ' hour') + ', ' +
								time.minutes + (time.minutes != 1 ? ' minutes ' : ' minute ') + 'and ' +
								time.seconds + (time.seconds != 1 ? ' seconds ' : ' second') +
								'! Nice try :robot:**'
							);

							client.query('COMMIT', (err) => {
							  if (err) {
							    console.error('Error committing transaction', err.stack);
							  }
							  done();
							});
						} else {
							// Get latest user avatar
					    	client.query(
						    	'INSERT INTO users (discord_id, username, discriminator, characters_count, week, year, avatar, dailies, dailies_timestamp) ' +
								'VALUES ($1, $2, $3, $4, $5, $6, $7, 20, timezone(\'utc\'::text, now())) ' +
								'ON CONFLICT (discord_id, week, year) DO UPDATE SET ' +
								'dailies = users.dailies + 20, ' +
								'dailies_timestamp = timezone(\'utc\'::text, now()) ' +
								'WHERE (timezone(\'utc\'::text, now()) >= users.dailies_timestamp + interval \'24 hours\' OR users.dailies_timestamp IS NULL) AND ' +
								'users.discord_id = $1 AND users.week = $5 AND users.year = $6 ',
								queryParams, (err, res) => {
					        if (shouldAbort(err)) {
					        	return;
					        }

					        message.channel.send(
										'**<:snax:230458568497692673>  |  ' + message.author.username + ', you received your <:kfc:296050563374776320> 20 daily SNAX points!**'
									);

					        client.query('COMMIT', (err) => {
					          if (err) {
					            console.error('Error committing transaction', err.stack);
					          }
					          done();
					        });
					      }
					    );
						}
		    	}
		    );
	    });
		});
	},

	// Processes rep command
	processRepCommand: function (message, pool) {
		if (message.channel.name !== 'bonobot-bonanza' && message.channel.name !== 'snax-bonobot') {
			//Send error message
			message.reply(createEmbed(
				[':warning: Please run rep command in #bonobot-bonanza channel to avoid spam.']
			));
			return;
		} else if (message.content.trim().indexOf('help') !== -1) {
			processHelpCommand(message, 'rep');
			return;
		}

		var verifyTimestamp = true;
		var date = new Date();
		var dateUTC = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
		var queryParams = [
			message.author.id, // discordID
			message.author.username, // username
			message.author.discriminator, // discriminator
			0, // characters_count
			getWeekOfYear(dateUTC), // week of the year
			dateUTC.getFullYear(), // year
			message.author.displayAvatarURL.replace('size=2048', 'width=60&height=60'), // avatar
		];		
		var time = {
			'hours' : 0,
			'minutes' : 0,
			'seconds' : 0
		}
		var reputationSent = [];
		var repLimit = config.reputationLimit[module.exports.getMemberRole(message.member).name];
		var responseMessage = '';

		pool.connect((err, client, done) => {
		  const shouldAbort = (err) => {
		    if (err) {
		      console.error('Error in transaction in processRepCommand', err.stack);
		      client.query('ROLLBACK', (err) => {
		        if (err) {
		          console.error('Error in rolling back client in processRepCommand', err.stack);
		        }
		        // Release the client back to the pool
		        done();
		      });
		    }
		    return !!err;
		  }

		  client.query('BEGIN', (err) => {
		    if (shouldAbort(err)) {
		    	return;
		    }

		    client.query(
		    	'SELECT reputation_sent::json, reputation_timestamp ' +
		    	'FROM users WHERE discord_id = $1 AND reputation_timestamp ' +
		    	'IS NOT NULL ORDER BY (year, week) DESC LIMIT 1',
		    	[queryParams[0]], (err, res) => {
			      if (shouldAbort(err)) {
			      	message.reply(createEmbed(
			      		[':boom: An error occurred!']
			      	));
			      	return;
			      } else if (res.rows.length === 0) {
			      	verifyTimestamp = false;
						} else {
							reputationSent = res.rows[0].reputation_sent;

							// reputation_timestamp + 24 hours
							var dailiesTimestamp = new Date(new Date(res.rows[0].reputation_timestamp + '').getTime() + 60 * 60 * 24 * 1000);
							var totalSeconds = Math.floor((dailiesTimestamp - dateUTC) / 1000);
							time.hours = Math.floor(totalSeconds / 3600);
							totalSeconds -= (time.hours % 24) * 3600;
							time.minutes = Math.floor(totalSeconds / 60) % 60;
							totalSeconds -= time.minutes * 60;
							time.seconds = totalSeconds % 60;
						}

						// If user row exists where reputation_timestamp is not null and 24 have passed => reset reputation
						if (verifyTimestamp && time.hours < 0) {
					    client.query(
					    	'UPDATE users SET reputation_sent = \'[]\'::json ' +
					    	'WHERE discord_id = $1 ',
					    	[queryParams[0]], (err, res) => {
						      if (shouldAbort(err)) {
						      	message.reply(createEmbed(
						      		[':boom: An error occurred on resetting reputation!']
						      	));
						      	return;
						      }
						    }
						  );
						  reputationSent = [];
						}

						// USer doesn't have more reputation to give
						if (reputationSent.length >= repLimit && verifyTimestamp && time.hours >= 0) {
							message.channel.send(
								'**<:snax:230458568497692673>  |  ' + message.author.username + ', you can award more <:cookie:285277471094472716> reputation in ' +
								time.hours   + (time.hours   != 1 ? ' hours'    : ' hour') + ', ' +
								time.minutes + (time.minutes != 1 ? ' minutes ' : ' minute ') + 'and ' +
								time.seconds + (time.seconds != 1 ? ' seconds ' : ' second') +
								'!**'
							);

							client.query('COMMIT', (err) => {
							  if (err) {
							    console.error('Error committing transaction', err.stack);
							  }
							  done();
							});
							return;
						} else { // User has reputation to give
							if (typeof message.mentions.users.first() === 'undefined') { //If no mention was made
								message.channel.send(
									'**<:snax:230458568497692673>  |  ' + message.author.username + ', you need to mention at least one user to award him with <:cookie:285277471094472716> reputation!** (type: `.rep help` for help)'
								);

								client.query('COMMIT', (err) => {
								  if (err) {
								    console.error('Error committing transaction', err.stack);
								  }
								  done();
								});

								return;
							}

							var errorMessages = ['', '', ''];
							var users = message.mentions.users.array();

							users = users.filter(function(user) {
								// User can't give rep to himself
								if (user.id == message.author.id) {
									errorMessages[0] = '**<:snax:230458568497692673>  |  ' + message.author.username + ', did you really expect to be able give <:cookie:285277471094472716> reputation to yourself?! :bell: Shame! :bell:**\n'
								} else if (user.bot) { // Can't give rep to bots
									if (user.id == '352554272065585152') {//snax-bonobot ID
										errorMessages[1] = '**<:snax:230458568497692673>  |  ' + message.author.username + ', I know you love me but my <:cookie:285277471094472716> reputation is already at max level! :kissing_heart:**\n'
									} else {
										errorMessages[2] = '**<:snax:230458568497692673>  |  ' + message.author.username + ', you can\'t give <:cookie:285277471094472716> reputation to bots... but they still love you anyway! <:snaxhearts:296063806432608266>**\n'
									}
								}
								return (user.id != message.author.id && !user.bot);
							});

							// Send error messages
							if (errorMessages[0] != '' || errorMessages[1] != '' || errorMessages[2] != '') {
								message.channel.send(
									errorMessages[0] + errorMessages[1] + errorMessages[2]
								);
							}

							var awardMessage = '';
							var repNumber = reputationSent.length;

							users.forEach(function(user, index) {
								// While user has reputation left
								if (reputationSent.length < repLimit) {
									if (reputationSent.indexOf(user.username) !== -1) {
									  // send error, You already gave reputation to user.username in the last 24 hours
									  message.channel.send(
									  	'**<:snax:230458568497692673>  |  ' + message.author.username + ', you already gave <:cookie:285277471094472716> reputation to ' + user.username + ' in the last 24 hours.**\n'
									  );
									  return;
									}

									var userParams = [
									  user.id,
									  user.username, // username
									  user.discriminator, // discriminator
									  0, // characters_count
									  getWeekOfYear(dateUTC), // week of the year
									  dateUTC.getFullYear(), // year
									  user.displayAvatarURL.replace('size=2048', 'width=60&height=60'), // avatar
									];

									reputationSent.push(user.username);

						      client.query(
							    	'INSERT INTO users (discord_id, username, discriminator, characters_count, week, year, avatar, reputation) ' +
							    	'VALUES ($1, $2, $3, $4, $5, $6, $7, 1) ' +
							    	'ON CONFLICT (discord_id, week, year) DO UPDATE SET ' +
							    	'reputation = users.reputation + 1 ' +
							    	'WHERE users.discord_id = $1 AND users.week = $5 AND users.year = $6 ',
										userParams, (err, res) => {
							        if (shouldAbort(err)) {
							        	return;
							        } else {
							        	if (awardMessage === '') {
							        		awardMessage += '**<:snax:230458568497692673>  |  ' + message.author.username + ' has given <@' + user.id + '> ';
							        	} else {
									      	awardMessage += ' <@' + user.id + '> ';
							        	}

							        	var params = queryParams.slice();
							        	params.push(JSON.stringify(reputationSent));

				        	      client.query(
				        		    	'INSERT INTO users (discord_id, username, discriminator, characters_count, week, year, avatar, reputation_sent, reputation_timestamp) ' +
				        		    	'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, timezone(\'utc\'::text, now())) ' +
				        		    	'ON CONFLICT (discord_id, week, year) DO UPDATE SET ' +
				        		    	'reputation_sent = $8, reputation_timestamp = timezone(\'utc\'::text, now()) ' +
				        		    	'WHERE users.discord_id = $1 AND users.week = $5 AND users.year = $6 ',
				        					params, (err, res) => {
				        		        if (shouldAbort(err)) {
				        		        	return;
				        		        } else {
				        		        	repNumber++;
				        		        	// If last iteration
				        		        	if (index === users.length - 1 || repNumber == repLimit) { 
		        		        				client.query('COMMIT', (err) => {
		        		        				  if (err) {
		        		        				    console.error('Error committing transaction', err.stack);
		        		        				  }
		        		        				  done();
		        		        				});

		        		        				if (awardMessage !== '') {
		        		        					awardMessage += 'a <:cookie:285277471094472716> reputation point! (Reputation left: ' + (repLimit - reputationSent.length) + ' <:cookie:285277471094472716>)**\n';
		        		        					responseMessage += awardMessage;
		        		        				}

		        		        				if (responseMessage !== '') {
		        		        					message.channel.send(
		        		        						responseMessage
		        		        					);
		        		        				}
				        		        	}
				        		        }
				        		      }
				        		    );
							        }
							      }
							    );
								}
							});
						}
		    	}
		    );
	    });
		});
	},

	// Register message in database
	registerMessage: function (message, pool) {
		message.content = message.content.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
		if (message.channel.name !== 'bonobot-bonanza' && message.content.length > 1) {
			var date = new Date();
			var dateUTC = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
			var queryParams = [
				message.author.id, // discordID
				message.author.username, // username
				message.author.discriminator, // discriminator
				message.content.length, // characters_count
				getWeekOfYear(dateUTC), // week of the year
				dateUTC.getFullYear(), // year
				message.author.displayAvatarURL.replace('size=2048', 'width=60&height=60')
			];

			//Connect to database to upsert data about user number of messages and characters
			pool
			.query(
				'INSERT INTO users (discord_id, username, discriminator, characters_count, week, year, avatar) ' +
				'VALUES ($1, $2, $3, $4, $5, $6, $7) ' +
				'ON CONFLICT (discord_id, week, year) DO UPDATE SET ' +
				'messages_count = users.messages_count + 1, ' +
				'characters_count = users.characters_count + $4, ' +
				'avatar = $7; ',
				queryParams, (err, res) => {
					if (err) {
						console.log("Error on UPSERT data for registerMessage: " + err);
					}
				}
			);

			//Connect to database to upsert data about user number of messages and characters
			pool
			.query(
				'UPDATE users SET ' +
				'valid_messages_count = users.valid_messages_count + 1, ' +
				'valid_characters_count = users.valid_characters_count + $2, ' +
				'timestamp = timezone(\'utc\'::text, now())' +
				'WHERE users.discord_id = $1 AND users.week = $3 AND EXTRACT(EPOCH FROM (now() - users.timestamp))/30 >= 1;',
				[queryParams[0], queryParams[3], queryParams[4]], (err, res) => {
					if (err) {
						console.log("Error on UPDATE valid messages and characters count for registerMessage: " + err);
					}
				}
			);
		}
	},

	// Reacts to messages
	processMessageReaction: function (message) {
		var authorUsername = message.author.username;
		var cleanMessage = message.content.trim();
		var random = Math.floor(Math.random() * 10);

		if (random > 6) {
			// Text/Voice Champion reactions
			if (authorUsername == config.topMembers.text) {
				if (random == 9) {
					message.react("✉")
						.then(reaction => reaction.message.react("🏆"));
				}
			}

			if (authorUsername == config.topMembers.voice) {
				if (random == 9) {
					message.react("🎙")
						.then(reaction => reaction.message.react("🏆"));
				}
			}

			if (config.topMembers.dailies.includes(authorUsername)) {
				if (random == 9) {
					message.react("335619664442818562")
						.then(reaction => reaction.message.react("🏆"));
				}
			}

			if (config.topMembers.reputation.includes(authorUsername)) {
				if (random == 9) {
					message.react("285277471094472716")
						.then(reaction => reaction.message.react("🏆"));
				}
			}

			if (cleanMessage.toLowerCase().indexOf('bonobo') !== -1) {
				message.channel.send(
					"<:bonobojizz:320292029227728897>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("320292029227728897"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('deez nuts') !== -1) {
				message.channel.send(
					"Suck deez robotic nuts!\n:gear: :gear:"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("274322312453554176"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('poop') !== -1) {
				message.channel.send(
					"<:kawaiipoop:296072782884896781>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("296072782884896781"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('gay') !== -1 ||
					cleanMessage.toLowerCase().indexOf('kappapride') !== -1) {
				message.channel.send(
					"<:KappaPride:335587672653561856>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("335587672653561856"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('kappa') !== -1 &&
					cleanMessage.toLowerCase().indexOf('kappapride') === -1) {
				message.channel.send(
					"<:kappa:230495935539576843>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("230495935539576843"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('kfc') !== -1) {
				message.channel.send(
					"<:kfc:296050563374776320>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("296050563374776320"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('salt') !== -1) {
				message.channel.send(
					"<:salt:278745703151435776>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("278745703151435776"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('atlas') !== -1) {
				if (random == 3) {
					message.react("🇮")
					.then(reaction => reaction.message.react("💗")
					.then(reaction => reaction.message.react("230476670421696523")));
				} else {
					message.react("230476670421696523")
					.then(reaction => reaction.message.react("284450372716855297"));
				}
			}

			if (cleanMessage.toLowerCase().indexOf('mxm') !== -1) {
				if (random == 3) {
					message.react("🇮")
					.then(reaction => reaction.message.react("💗")
					.then(reaction => reaction.message.react("300551231829704705")));
				} else {
					message.react("300551231829704705")
					.then(reaction => reaction.message.react("284450372716855297"));
				}
			}

			if (cleanMessage.toLowerCase().indexOf('dongr') !== -1 ||
					cleanMessage.toLowerCase().indexOf('donger') !== -1 ||
					cleanMessage.toLowerCase().indexOf('dick') !== -1) {
				message.channel.send(
					"<:dongr:274322312453554176>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("274322312453554176"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('rick') !== -1 &&
					cleanMessage.toLowerCase().indexOf('morty') !== -1) {
				if (random == 3) {
					message.channel.send(
						"<:TinyRick:331832938608066561>"
					).then(message => message.delete(10000));
					setTimeout(function(){ message.react("331832938608066561"); }, 10500);
				} else {
					message.channel.send(
						"<:PickleRick:331833044023508995>"
					).then(message => message.delete(10000));
					setTimeout(function(){ message.react("331833044023508995"); }, 10500);
				}
			}

			if (cleanMessage.toLowerCase().indexOf('pickle') !== -1) {
				message.channel.send(
					"<:PickleRick:331833044023508995>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("331833044023508995"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('facepalm') !== -1) {
				message.channel.send(
					"<:facepalm:278745692334456832>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("278745692334456832"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('cum') !== -1) {
				message.channel.send(
					":sweat_drops:"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("💦"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('omar') !== -1) {
				if (random == 3) {
					message.channel.send(
						"<:handsome_omar:325850491122614274>"
					).then(message => message.delete(10000));
					setTimeout(function(){ message.react("325850491122614274"); }, 10500);
				} else {
					message.channel.send(
						"<:OmarPepe:324688036476616724>"
					).then(message => message.delete(10000));
					setTimeout(function(){ message.react("324688036476616724"); }, 10500);
				}
			}

			if (cleanMessage.toLowerCase().indexOf('dailure') !== -1 ||
					cleanMessage.toLowerCase().indexOf('dale') !== -1) {
				message.channel.send(
					"<:dailure_isthatso:325850313452158996>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("325850313452158996"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('poky') !== -1) {
				message.channel.send(
					"<:haha:334444953545605122>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("334444953545605122"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('arctic') !== -1) {
				message.channel.send(
					"<:arctic_wat:325850477109575691>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("325850477109575691"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('donjay') !== -1 ||
					cleanMessage.toLowerCase().indexOf('don jay') !== -1) {
				message.channel.send(
					"<:coolstory_donjay:325849857321467916>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("325849857321467916"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('feels good') !== -1 ||
					cleanMessage.toLowerCase().indexOf('feelsgood') !== -1) {
				message.channel.send(
					"<:feelsgoodman:284450372716855297>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("284450372716855297"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('feels bad') !== -1 ||
					cleanMessage.toLowerCase().indexOf('feelsbad') !== -1) {
				message.channel.send(
					"<:feelsbadman:284396022682222592>"
				).then(message => message.delete(10000));
				setTimeout(function(){ message.react("284396022682222592"); }, 10500);
			}

			if (cleanMessage.toLowerCase().indexOf('vezzed') !== -1 ||
					cleanMessage.toLowerCase().indexOf('vexxed') !== -1 ||
					cleanMessage.toLowerCase().indexOf('vexed') !== -1) {
				message.channel.send(
					"V E <:veZzed:336635653259264010> E D"
				).then(message => message.delete(10000));
				setTimeout(function(){
					message.react("296029985779613701")
					.then(reaction => reaction.message.react("336635653259264010")
					.then(reaction => reaction.message.react("296029498388774914"))); },
				10500);
			}
		}
	},

	// Returns members playing a specific game
	processPlayingCommand: function (message, guild, richEmbed) {
		// Convert guild members to array
		let guildMembers = guild.members.array();

		// Removes '.playing' at the start and whitespaces at the start and end
		let game = message.content.substring(8).trim().toLowerCase();
		
		// Ignore members not playing and bots
		guildMembers = guildMembers.filter(function(member) {
			return (
				member.presence.game !== null &&
				!member.user.bot && member.presence.game.name.length < 50 &&
				config.blockedStatus.indexOf(member.presence.game.name) === -1 &&
				member.presence.game.name.toLowerCase() === game
			);
		});

		if (!guildMembers.length) {
			message.channel.send('No one is playing ' + game + ' <:feelsbadman:284396022682222592>');
			return;
		} else {
			let embed = createPlayingEmbed(richEmbed, guildMembers, game);
			message.channel.send({
				embed
			}).catch(err => console.log(err));
		}
	},

	processSnaxClubCommand(message, command, pool, richEmbed) {
		// Removes 'club' at the start and whitespaces at the start and end
		command = command.substring(4).trim();

		if (command.indexOf('help') !== -1) {
			if (message.channel.name === 'bonobot-bonanza' || message.channel.name === 'snax-bonobot') {
			// if (message.channel.name === 'snax-bonobot') {
				processHelpCommand(message, 'club');
				return;
			}

			//Send error message
			message.reply(createEmbed(
				[':warning: Please run help commands in #bonobot-bonanza channel to avoid spam.']
			));
			return;
		} else if (command.indexOf('create')) { // Create character
			pool.connect((err, client, done) => {
				const shouldAbort = (err) => {
					if (err) {
						console.error('Error in transaction in processRepCommand', err.stack);
						client.query('ROLLBACK', (err) => {
							if (err) {
								console.error('Error in rolling back client in processRepCommand', err.stack);
							}
							// Release the client back to the pool
							done();
						});
					}
					return !!err;
				}

				client.query('BEGIN', (err) => {
					if (shouldAbort(err)) {
						return;
					}

					client.query(
						'SELECT character_info::json ' +
			    		'FROM snaxclub_players WHERE player_discord_id = $1 ',
			    		[message.author.id], (err, res) => {
							if (shouldAbort(err)) {
								message.reply(createEmbed(
								    [':boom: An error occurred!']
								));
				      			return;
				      		} else if (res.rows.length !== 0) { // Character not created yet
				     			// Send DM to user with link to create character in SNAX CLUB
				     		} else { // Character found
				      			message.reply(createEmbed(
				     				[':warning: You have already joined SNAX CLUB!']
				     			));
				     			return;
				      		}
				      	}
				    );
				});
			});
		} else if (typeof(message.mentions.users.first()) !== 'undefined') { // View member character
			pool.connect((err, client, done) => {
				const shouldAbort = (err) => {
					if (err) {
						console.error('Error in transaction in processRepCommand', err.stack);
						client.query('ROLLBACK', (err) => {
							if (err) {
								console.error('Error in rolling back client in processRepCommand', err.stack);
							}
							// Release the client back to the pool
							done();
						});
					}
					return !!err;
				}

				client.query('BEGIN', (err) => {
					if (shouldAbort(err)) {
						return;
					}

					client.query(
						'SELECT character_info::json ' +
			    		'FROM snaxclub_players WHERE player_discord_id = $1 ',
			    		[message.mentions.users.first().id], (err, res) => {
							if (shouldAbort(err)) {
								message.reply(createEmbed(
								    [':boom: An error occurred!']
								));
				      			return;
				      		} else if (res.rows.length === 0) { // Character not created yet
				     			message.reply(createEmbed(
				     				[':warning: ' + message.mentions.users.first().username + ' still didn\'t join SNAX CLUB!']
				     			));
				     			return;
				     		} else { // Character found
				      			let embed = createSnaxClubCharacterEmbed(richEmbed, res.rows[0].character_info);
				      			message.channel.send({
				      				embed
				      			}).catch(err => console.log(err));
				      		}
				      	}
				    );
				});
			});
		}
	},

	// Registers most played games every hour
	registerMostPlayedGames: function (guild, richEmbed) {
		// Convert guild members to array
		let guildMembers = guild.members.array();
		// Ignore members not playing and bots
		guildMembers = guildMembers.filter(function(member) {
			return (
				member.presence.game !== null &&
				!member.user.bot &&
				member.presence.game.name.length < 50 &&
				config.blockedStatus.indexOf(member.presence.game.name) === -1
			);
		});

		guildMembers.forEach(function(member) {
			let newGame = true;

			for (let i = 0; i < config.mostPlayedGames.length; i++) {
				if (config.mostPlayedGames[i].game === member.presence.game.name) {
					newGame = false;

					if (config.mostPlayedGames[i].users.usernames.indexOf(member.user.username) === -1) {
						config.mostPlayedGames[i].users.count += 1;
						config.mostPlayedGames[i].users.usernames.push(member.user.username);
					}
					break;
				}
			};

			if (newGame) {
				config.mostPlayedGames.push({
					game: member.presence.game.name,
					users: {
						count: 1,
						usernames: [
							member.user.username
						]
					}
				});
			}
		});

		console.log("config.mostPlayedGames: ");
		console.log(JSON.stringify(config.mostPlayedGames, null, 4));
	},

	logMostPlayedGamesOfTheDay: function (guild, richEmbed) {
		if (config.mostPlayedGames.length) {
			config.mostPlayedGames.sort(function(a, b) {
				a.gameValue = config.popularGames.indexOf(a.game);
				b.gameValue = config.popularGames.indexOf(b.game);
				return b.users.count - a.users.count || b.gameValue - a.gameValue;
			});

			config.mostPlayedGames = config.mostPlayedGames.slice(0, 5);

			let channel = guild.channels.find(channel =>
				channel.name === 'bonobot-bonanza'
			);
			// Do nothing if the channel wasn't found on this server
			if (!channel) {
				console.log("\nERROR: logMostPlayedGamesOfTheDay channel not found!!!\n");
				return;
			} else {
				let embed = createMostPlayedGamesEmbed(richEmbed, config.mostPlayedGames);
				channel.send({
					embed
				})
					.then(() => {
						// Clean array
						config.mostPlayedGames = [];
					})
					.catch(err => console.log(err));
			}
		}
	},

	logTopOfTheMonth: function (pool, guild, mention, textRichEmbed, voiceRichEmbed) {
		var date = new Date();
		var month = date.getMonth();
		// Check if it is the first day of the Month
		date.setHours(date.getHours() - 24);
		if (month == date.getMonth()) {
			mention = false
		}

		// Stop logging to debug channel
		if (!mention) {
			return;
		}

		var query = 'SELECT discord_id, username, SUM(valid_messages_count) as valid_messages_count, SUM(valid_characters_count) as valid_characters_count, ' +
					'SUM(seconds_muted) as seconds_muted, SUM(seconds_unmuted) as seconds_unmuted, SUM(voice_points) as voice_points, ' +
					'SUM(dailies) as dailies, SUM(reputation) as reputation ' +
					'FROM users WHERE ' + getLast4WeeksQuery() + ' GROUP BY (discord_id, username) ';

		pool.connect((err, client, done) => {
		  const shouldAbort = (err) => {
		    if (err) {
		      console.error('Error in transaction in logTopOfTheMonth', err.stack);
		      client.query('ROLLBACK', (err) => {
		        if (err) {
		          console.error('Error in rolling back client in logTopOfTheMonth', err.stack);
		        }
		        // Release the client back to the pool
		        done();
		      });
		    }
		    return !!err;
		  }

		  client.query('BEGIN', (err) => {
		    if (shouldAbort(err)) {
		    	return;
		    }

				client.query(query, [], (err, res) => {
					if (shouldAbort(err)) {
						return;
					} else {
						if (res.rows.length === 0) {
							console.log("ERROR: NO STATS RETURNED FROM logTopOfTheMonth");
						} else {
							// Remove champion members from stats
							res.rows = res.rows.filter(function(user) {
								var member = guild.members.get(user.discord_id.toString());
								if (typeof member !== 'undefined') {
									var userRole = module.exports.getMemberRole(member);
									return (userRole.name != 'Champion' && userRole.name != 'Officer');
								}
								return false;
							});

							// Iterate through users from query result and calculate points and sort array after
							res.rows.forEach(function(user) {
								user.textPoints = calculateTextPoints(user.valid_messages_count, user.valid_characters_count, user.dailies);
								user.voicePoints = calculateVoicePoints(user.seconds_unmuted, user.seconds_muted, user.voice_points, user.dailies);
							});

							// Order array by text points descending
							res.rows.sort(function(a, b) {
								return parseInt(b.textPoints) - parseInt(a.textPoints);
							});
							var textTop = res.rows.slice(0, 3);

							// Order array by voice points descending
							res.rows.sort(function(a, b) {
								return parseInt(b.voicePoints) - parseInt(a.voicePoints);
							});
							var voiceTop = res.rows.slice(0, 3);

							// Order array by dailies descending
							res.rows.sort(function(a, b) {
								return parseInt(b.dailies) - parseInt(a.dailies);
							});
							var dailiesTop = res.rows;
							for (var i = 1; i < dailiesTop.length; i++) {
								if (dailiesTop[i-1].dailies == dailiesTop[i].dailies) {
									continue;
								} else {
									dailiesTop = dailiesTop.slice(0, i);
									break;
								}
							}

							// Order array by reputation descending
							res.rows.sort(function(a, b) {
								return parseInt(b.reputation) - parseInt(a.reputation);
							});
							var reputationTop = res.rows;
							for (var i = 1; i < reputationTop.length;	 i++) {
								if (reputationTop[i-1].reputation == reputationTop[i].reputation) {
									continue;
								} else {
									reputationTop = reputationTop.slice(0, i);
									break;
								}
							}

							var channel = null;
							if (mention) {
								channel = guild.channels.find(channel =>
									channel.name === 'announcements'
								);

								// Assign top members
								config.topMembers.text = textTop[0].username;
								config.topMembers.voice = voiceTop[0].username;
								config.topMembers.dailies = dailiesTop;
								config.topMembers.reputation = reputationTop;
							} else {
								// channel = guild.channels.find('name', 'snax-bonobot');
							}

							// Do nothing if the channel wasn't found on this server
							if (!channel) {
								console.log("\nERROR: logTopOfTheMonth | announcements channel not found!!!\n");
								client.query('COMMIT', (err) => {
								  if (err) {
								    console.error('Error committing transaction', err.stack);
								  }
								  done();
								});
								return;
							} else {
								// Get avatars for top text users
								client.query(
									'SELECT avatar FROM users WHERE discord_id = $1 ORDER BY (year, week) DESC LIMIT 1',
										[textTop[0].discord_id], (err, res) => {
									if (shouldAbort(err)) {
										return;
									}
									if (res.rows.length !== 0) {
										textTop[0].avatar = res.rows[0].avatar;
									} else {
										textTop[0].avatar = '';
									}

									client.query(
										'SELECT avatar FROM users WHERE discord_id = $1 ORDER BY (year, week) DESC LIMIT 1',
											[textTop[1].discord_id], (err, res) => {
										if (shouldAbort(err)) {
											return;
										}
										if (res.rows.length !== 0) {
											textTop[1].avatar = res.rows[0].avatar;
										} else {
											textTop[1].avatar = '';
										}

										client.query(
											'SELECT avatar FROM users WHERE discord_id = $1 ORDER BY (year, week) DESC LIMIT 1',
												[textTop[2].discord_id], (err, res) => {
											if (shouldAbort(err)) {
												return;
											}
											if (res.rows.length !== 0) {
												textTop[2].avatar = res.rows[0].avatar;
											} else {
												textTop[2].avatar = '';
											}

											client.query(
												'SELECT avatar FROM users WHERE discord_id = $1 ORDER BY (year, week) DESC LIMIT 1',
													[voiceTop[0].discord_id], (err, res) => {
												if (shouldAbort(err)) {
													return;
												}
												if (res.rows.length !== 0) {
													voiceTop[0].avatar = res.rows[0].avatar;
												} else {
													voiceTop[0].avatar = '';
												}

												client.query(
													'SELECT avatar FROM users WHERE discord_id = $1 ORDER BY (year, week) DESC LIMIT 1',
														[voiceTop[1].discord_id], (err, res) => {
													if (shouldAbort(err)) {
														return;
													}
													if (res.rows.length !== 0) {
														voiceTop[1].avatar = res.rows[0].avatar;
													} else {
														voiceTop[1].avatar = '';
													}

													client.query(
														'SELECT avatar FROM users WHERE discord_id = $1 ORDER BY (year, week) DESC LIMIT 1',
															[voiceTop[2].discord_id], (err, res) => {
														if (shouldAbort(err)) {
															return;
														}
														if (res.rows.length !== 0) {
															voiceTop[2].avatar = res.rows[0].avatar;
														} else {
															voiceTop[2].avatar = '';
														}

														client.query('COMMIT', (err) => {
														  if (err) {
														    console.error('Error committing transaction', err.stack);
														  }
														  done();
														});

														var download = function(uri, filename, callback) {
														  request.head(uri, function(err, res, body) {
														    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
														  });
														};

														download(textTop[0].avatar, 'public/imgs/avatars/' + 'first_text.png', function() {
															download(textTop[1].avatar, 'public/imgs/avatars/' + 'second_text.png', function() {
																download(textTop[2].avatar, 'public/imgs/avatars/' + 'third_text.png', function() {
																	download(voiceTop[0].avatar, 'public/imgs/avatars/' + 'first_voice.png', function() {
																		download(voiceTop[1].avatar, 'public/imgs/avatars/' + 'second_voice.png', function() {
																			download(voiceTop[2].avatar, 'public/imgs/avatars/' + 'third_voice.png', function() {
																				images("./public/imgs/podium.png")
																			    .draw(images("./public/imgs/avatars/second_text.png").size(100), 14, 40) //2nd
																			    .draw(images("./public/imgs/avatars/first_text.png").size(100), 129, 10) //1st
																			    .draw(images("./public/imgs/avatars/third_text.png").size(100), 244, 60) //3rd
																			    .save("text_podium.png", {
																			        quality : 80
																			    });

																			  images("./public/imgs/podium.png")
																			    .draw(images("./public/imgs/avatars/second_voice.png").size(100), 14, 40) //2nd
																			    .draw(images("./public/imgs/avatars/first_voice.png").size(100), 129, 10) //1st
																			    .draw(images("./public/imgs/avatars/third_voice.png").size(100), 244, 60) //3rd
																			    .save("voice_podium.png", {
																			        quality : 80
																			    });
																	            var embed = '';

														            			//Upload text podium image
																				imgur.uploadFile('text_podium.png')
																			    .then(function (json) {
																			        channel.send((!mention ?
																			        	'**Congratulations to :trophy: ' + textTop[0].username + ' :trophy: for being the most active user in :envelope: text channels in the last 4 weeks!!!**\n' +
																			        	'Shoutout to **' + textTop[1].username + '** and **' + textTop[2].username + '** for reaching **2nd** and **3rd** place!\n'
																			        	:
																			        	'**Congratulations to ' + ' <@' + textTop[0].discord_id + '> ' + 'for being the most active user in :envelope: text channels in the last 4 weeks!!!**\n' +
																			        	'Shoutout to ' + ' <@' + textTop[1].discord_id + '> ' + ' and ' + ' <@' + textTop[2].discord_id + '> ' + ' for reaching **2nd** and **3rd** place!'
																			        )).then(function() {
																				        embed = createPodiumEmbed(textRichEmbed, textTop, 'text', json.data.link);
																				        channel.send({
																				        	embed
																				        }).then(function() {
																					        // Upload voice podium image
																				        	imgur.uploadFile('voice_podium.png')
																				            .then(function (json) {
																				                channel.send((!mention ?
																				                	'**Congratulations to :trophy: ' + voiceTop[0].username + ' :trophy: for being the most active user in :microphone2: voice channels in the last 4 weeks!!!**\n' +
																				                	'Shoutout to **' + voiceTop[1].username + '** and **' + voiceTop[2].username + '** for reaching **2nd** and **3rd** place!\n'
																				                	:
																				                	'**Congratulations to :trophy:' + ' <@' + voiceTop[0].discord_id + '> ' + ':trophy: for being the most active user in :microphone2: voice channels in the last 4 weeks!!!**\n' +
																				                	'Shoutout to ' + ' <@' + voiceTop[1].discord_id + '> ' + ' and ' + ' <@' + voiceTop[2].discord_id + '> ' + ' for reaching **2nd** and **3rd** place!'
																				                )).then(function() {
																					                embed = createPodiumEmbed(voiceRichEmbed, voiceTop, 'voice', json.data.link);
																					                channel.send({
																					                	embed
																					                }).then(function() {
																		                	            var dailiesMessage = '- ';
																		                            	dailiesTop.forEach(function(user) {
																		                            		dailiesMessage += (mention ? '<@' + user.discord_id + '> ' : user.username + ' ');
																		                            	})
																		                            	dailiesMessage += 'with ' + (dailiesTop[0].dailies / 20) + ' <:doublerainbow:335619664442818562> **Dailies**!\n';

																		                            	var reputationMessage = '- ';
																		                            	reputationTop.forEach(function(user) {
																		                            		reputationMessage += (mention ? '<@' + user.discord_id + '> ' : user.username + ' ');
																		                            	})
																		                            	reputationMessage += 'with ' + reputationTop[0].reputation + ' <:cookie:285277471094472716> **Reputation**!\n';

																						                channel.send(
																						                	'Special mentions to members with most <:doublerainbow:335619664442818562> **Dailies** and <:cookie:285277471094472716> **Reputation**:\n' +
																						                	dailiesMessage + reputationMessage +
																						                	'\nThanks to ALL members for your activity in <:snax:230458568497692673>**SNAXKREW**<:snax:230458568497692673> community! <:snaxhearts:296063806432608266>'
																						                )
																					                }).catch(err => console.log(err));
																				                }).catch(err => console.log(err));
																				            }).catch(function (err) {
																			                console.error(err.message);
																				            });
																				        }).catch(err => console.log(err));
																			        }).catch(err => console.log(err));
																			    }).catch(function (err) {
																		        console.error(err.message);
																			    });
																			  });
																		});
																	});
												        });
											        });
												    });
													});
												});
											});
										});
									});
								});
							}
						}
					}
				});
			});
		});
	},

	logMemes: function (guild, richEmbed) {
		var memeChannel = guild.channels.find(channel =>
			channel.name === 'memeville'
		);
		// var memeChannel = guild.channels.find('name', 'snax-bonobot');
		if (!memeChannel) {
			console.log("ERR: MEME CHANNEL NOT FOUND");
			return;
		}

		var botMessages = "";

		request('https://www.reddit.com/r/dankmemes/hot.json?limit=1', function(err, res, body) {
  		if (err) {
  			console.error("Error caught in logMemes inside request: " + err);
  		} else {
  			var body = JSON.parse(body);
  			var meme = body.data.children[body.data.children.length - 1].data;

  			// If post is stickied it means it is not a meme
  			if (meme.stickied) {
  				return;
  			}

  			memeChannel.fetchMessages()
  				.then(messages => {
  					// Get embed with url equal to meme fetched
  					botMessages = messages.filter(function(message) {
  						if (message.author.username == 'snax-bonobot' && message.embeds.length) {
  							if (typeof message.embeds[0].url !== 'undefined') {
  								return (message.embeds[0].url == meme.url)
  							}
  						}
  					});

  					// If there is one embed after filter it means the meme was already posted
						if (botMessages.size) {
							botMessages = botMessages.last();
							return;
						} else {
							var embed = createMemeEmbed(richEmbed, meme);
							memeChannel.send({
								embed
							}).catch(err => console.log(err));
						}
					})
		  		.catch(console.error);
			}
		});
	},

	logStreamMessage: function (guild, member, richEmbed) {
		console.log("Running logStreamMessage!");

		let channel = guild.channels.find(channel =>
			channel.name === 'stream-addicts'
		);

		if (!channel) {
			console.log("ERR: STREAM CHANNEL NOT FOUND");
			return;
		}

		let logStreamMessage = true;
			// Get messages
		channel.fetchMessages({ limit: 1 })
			.then(messages => {
				messages.filter(function(message) {
					if (typeof message.embeds[0] !== "undefined") {
						if (message.embeds[0].title == (member.user.username + ' just started streaming!')) {
							logStreamMessage = false;
						}
					}
				});
					
				if (logStreamMessage) {
					var embed = createStreamEmbed(richEmbed, member);

					https.get(encodeURI(member.presence.game.url), function (res) {
						let rawData = '';
						res.on('data', (chunk) => {
							rawData += chunk;
						});
						res.on('end', () => {
							try {
								const $ = cheerio.load(rawData);
								let streamImage = $('meta[property="og:image"]').attr('content');
								// Add http when image starts with // to avoid malformed urls
								streamImage = streamImage.replace(/^\/\/?/i, "https://");

								if (streamImage.length) {
									embed.setImage(streamImage);
								}
								channel.send({
									embed
								}).catch(err => console.log(err));
							} catch (e) {
								channel.send({
									embed
								}).catch(err => console.log(err));
								console.error(e.message);
							}
						});
					}).on('error', function (e) {
						console.log("ERROR");
						channel.send({
							embed
						}).catch(err => console.log(err));
						console.log("Got error: " + e.message);
					});
				}
			})
			.catch(console.error);
	},

	raceGame: function (guild, message, Discord) {
		if (message.channel.name !== 'bonobot-bonanza') {
			message.reply(createEmbed(
				[':warning: Please run race game in #bonobot-bonanza channel to avoid spam.']
			));
			return;
		}

		console.log("Running raceGame!");
		if (config.raceInProgress) {
			message.reply('please wait for the current race to be over!');
			return;
		}

		config.raceInProgress = true;
		let winner = -1;
		let game = "";
		let racers = []; // Members that joined the race
		let players = JSON.parse(JSON.stringify(shuffle(config.racePlayers)));
		
		let channel = guild.channels.find(channel =>
			channel.name === 'bonobot-bonanza'
		);
		if (!channel) {
			console.log("ERROR: bonobot-bonanza CHANNEL NOT FOUND");
			config.raceInProgress = false;
			return;
		}

		// Add user who ran the race command to race
		racers.push(message.author.username);

		message.channel.send(
			':race_car: The race is going to begin in **15 seconds**, type `.join` to join!' + '\n**Player ' + racers.length + ' ' + players[racers.length - 1].avatar + ' :** *' + message.author.username + '*'
		).then((message) => {
			const filter = message => message.content.trim().toLowerCase() === '.join';
			// Create a message collector
			const collector = new Discord.MessageCollector(channel, filter, { time: 15000 });
			collector.on('collect', (m) => {
				console.log("Received join from: " + m.author.username);
				console.log(racers.indexOf(m.author.username) === -1);
				if (racers.indexOf(m.author.username) === -1) {
					if (racers.length < players.length) {
						racers.push(m.author.username);
						message.edit(message.content + '\n**Player ' + racers.length + ' ' + players[racers.length - 1].avatar + ' :** *' + m.author.username + '*');
					} else {
						message.channel.send(
							"Too late! Try to join next race..."
						).then(message => message.delete(5000));
					}
				}
				m.delete(1000);
			});
			collector.on('end', (collected) => {
				// If no one else joined the race
				if (racers.length < 2) {
					message.channel.send(
						racers[0] + ', there\'s not enough players to race with <:feelsbadman:284396022682222592>'
					)
					config.raceInProgress = false;
					return;
				}

				// Slice array with total racers
				players = players.slice(0, racers.length);

				for (let i = 0; i < players.length; i++) {
					game += players[i].board;
				}

				message.channel.send(
					':race_car: **The race is about to begin!** Good luck to everyone!\n'
				).then((message) => {

					let counter = 3;
					let countdown = function() {
						switch (counter) {
							case 3:
								message.content += '\n:octagonal_sign: *3*';
								message.edit(message.content);
								break;
							case 2:
								message.content += '\n:high_brightness: *2*';
								message.edit(message.content);
								break;
							case 1:
								message.content += '\n:high_brightness: *1*';
								message.edit(message.content);
								break;
							case 0:
								message.content += '\n<:feelsgoodman:284450372716855297> *GOOO*';
								message.edit(message.content);
								clearInterval(countdownTimer);
								break;
							default:
								break;
						}
						counter--;

						if (counter < 0) {
							// if (config.botAvailable) {
							// 	if (typeof message.member.voiceChannelID !== "undefined") {
							// 		var voiceChannel = message.member.voiceChannel;
							// 	}
							// }

							message.channel.send(
								':race_car: **Gas gaass gaaasss!** :race_car:\n\n'
							).then(message =>
								message.channel.send(
									game
								).then((message) => {

							    // 	if (typeof voiceChannel !== "undefined") {
											// //Join user channel and play sound
											// voiceChannel.join().then(connection => {
											// 	config.botAvailable = false;
											// 	var dispatcher = connection.playFile('public/sound/gas.mp3');
											// 	dispatcher.on('end', reason => {
											// 		voiceChannel.leave();
											// 		config.botAvailable = true;
											// 	})
											// }).catch(console.error);
								  	// }

									let race = function() {
										// Calculate points and winner
										for (let i = 0; i < players.length; i++) {
											players[i].points += Math.floor(Math.random() * 5);

											if (players[i].points >= 30) {
												// If a winner was already found, check who was the most points
												if (winner >= 0) {
													if (players[i].points > players[winner].points) {
														players[winner].points = 29;
														winner = i;
													} else {
														players[i].points = 29;
													}
												} else {
													winner = i;
												}
												clearInterval(timer);
											}
										}

										// Maximize winner points to 31
										if (winner >= 0) {
											players[winner].points = 31;
										}

										// Draw board
										for (let i = 0; i < players.length; i++) {
											// Draw board 
											players[i].board = '\n:vertical_traffic_light:|';
											for (let j = 0; j < players[i].points; j++) {
												players[i].board += '-';
											}

											players[i].board += players[i].avatar;
											for (let j = players[i].points; j < 30; j++) {
												players[i].board += '-';
											}

											players[i].board += ':checkered_flag:';
										}

										// Draw board for each player
										game = '';
										for (let i = 0; i < players.length; i++) {
											game += players[i].board;
										}

										if (winner >= 0) {
											game += '\n\n**' + racers[winner] + ' wins!** ' + players[winner].avatar;
											config.raceInProgress = false;
										}

										message.edit(game);
									};

									let timer = setInterval(race, 1500);
								})
							);
						};
					}
						
					let countdownTimer = setInterval(countdown, 1000);
				});
			});
		});
	},

	hangmanGame: function (guild, message, Discord) {
		if (message.channel.name !== 'bonobot-bonanza') {
			message.reply(createEmbed(
				[':warning: Please run hangman game in #bonobot-bonanza channel to avoid spam.']
			));
			return;
		}

		let userLetter = ':white_medium_square: ';

		console.log("Running hangmanGame!");
		if (config.hangmanInProgress) {
			message.reply('please wait for the current hangman game to be over!');
			return;
		}

		config.hangmanInProgress = true;
		
		// Random word uppercase
		let word = config.hangmanWords[Math.floor(Math.random() * (config.hangmanWords.length - 1))];
		word = word.charAt(0).toUpperCase() + word.slice(1);

		let lettersMissed = [];
		let indicesFound = [];
		let wordFound = false;
		let lifes = 6;
		let board = {
			'word' : '',
			'hangman' : [
				"\n||=====|",
				"\n||",
				"\n||",
				"\n||",
				"\n||",
				"\n||",
				"\n||",
			],
			'lettersMissed' : ''
		};

		let drawHangman = function() {
			switch (lifes) {
				case 5 :
					if (wordFound) {
						board.hangman[1] = "\n||   <:feelsgoodman:284450372716855297>";
					} else {
						board.hangman[1] = "\n||   :cold_sweat:";
					}
					break;
				case 4 :
					board.hangman[2] = "\n||     |";
					break;
				case 3 :
					board.hangman[2] = "\n||    /|";
					break;
				case 2 :
					board.hangman[2] = "\n||    /|\\";
					break;
				case 1 :
					board.hangman[3] = "\n||    /";
					break;
				case 0 :
					board.hangman[3] = "\n||    /\\";
					break;
			}
		};

		let drawBoard = function() {
			// Reset word board
			board.word = '**';
			// Draw word board
			for (let i = 0; i < word.length; i++) {
			    if (indicesFound.indexOf(i) !== -1) {
			    	board.word += ' :regional_indicator_' + word[i].toLowerCase() + ':';
			    } else {
			    	board.word += ' ' + userLetter;
			    }
			}
			board.word += '**';

			// Draw hangman
			let hangman = '';
			drawHangman();
			for (let i = 0; i < board.hangman.length; i++) {
				hangman += board.hangman[i];
			}

			// Reset lettersMissed board
			board.lettersMissed = '';
			// Draw missed letters
			if (lettersMissed.length) {
				board.lettersMissed = '\n**Missed letters: **';
			}
			for (let i = 0; i < lettersMissed.length; i++) {
			    board.lettersMissed += lettersMissed[i].toUpperCase() + ' ';
			}

			return board.word + '\n' + hangman + board.lettersMissed;
		};


		let channel = guild.channels.find(channel =>
			channel.name === 'bonobot-bonanza'
		);
		
		if (!channel) {
			console.log("ERROR: bonobot-bonanza CHANNEL NOT FOUND");
			config.raceInProgress = false;
			return;
		}

		message.channel.send(
			'You have **2 minutes** to guess the word and save the hangman! Start typing your guesses!\n' +
			drawBoard()
		).then((message) => {
			// Create a message collector
			const filter = message => message.content.search(/^[a-zA-Z]*$/) !== -1;
			const collector = new Discord.MessageCollector(channel, filter, { time: 120000 });
			collector.on('collect', (m) => {

				let guess = m.content;
				if (lettersMissed.indexOf(guess.toUpperCase()) !== -1) {
					return;
				}

				// Single letter
				if (m.content.length == 1) {
					let indices = [];
					for (let i = 0; i < word.length; i++) {
					    if (word[i].toUpperCase() == guess.toUpperCase()) {
					    	indices.push(i);
					    	indicesFound.push(i);
					    }
					}

					if (!indices.length) {
						lettersMissed.push(guess);
						lifes--;
					} else if (indicesFound.length == word.length) {
						wordFound = true;
						collector.stop();
						return;
					}
					
					// Only draw board again when user types a single letter and doesn't guess the word
					if (!wordFound) {
						m.channel.send(drawBoard());
					}
				} else if (m.content.length > 1) { // Word
					if (guess == word) {
						wordFound = true;
						for (let i = 0; i < word.length; i++) {
						    if (indicesFound.indexOf(i) === -1) {
						    	indicesFound.push(i);
						    }
						}
						collector.stop();
						return;
					}
				}

				if (!lifes) {
					collector.stop();
					return;
				}
			});

			collector.on('end', (collected) => {
				if (wordFound) {
					message.channel.send(
						drawBoard() +
						'\n**Congrats, you found the word!**'
					);
				} else if (!lifes) {
					message.channel.send(
					    drawBoard() +
						'\nYou let him die! <:feelsbadman:284396022682222592>\nThe word was **' + word + '**'
					)
				} else {
					message.channel.send(
					    drawBoard() +
						'\nTime\'s up! The word was **' + word + '**\nHow could you not guess that!? :thinking:'
					)
				}
				config.hangmanInProgress = false;
			});
		});
	},

	// Updates voice points each minute
	updateVoicePoints: function (pool, guild) {
		activeVoiceChannels = guild.channels.filter(function(channel) {
			return (channel.type === 'voice' && channel.members.array().length > 0 && channel.id !== guild.afkChannelID);
		});

		var date = new Date();
		var dateUTC = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

		activeVoiceChannels.forEach(function(channel) {
			var channelMembers = channel.members.array();
			channelMembers.forEach(function(member) {

				// Ignore bots
				if (member.user.bot) {
					return;
				}

				var voicePoints = (channelMembers.length > 1 ? (channelMembers.length * 0.25) + 1 : 0);
				var selfMute = member.selfMute;

				var queryParams = [
					member.user.id, // discordID
					member.user.username, // username
					member.user.discriminator, // discriminator
					member.user.displayAvatarURL.replace('size=2048', 'width=60&height=60'),
					0, // characters_count
					getWeekOfYear(dateUTC), // week of the year
					dateUTC.getFullYear(), // year
					voicePoints
				];

				pool.connect((err, client, done) => {
			  const shouldAbort = (err) => {
			    if (err) {
			      console.error('Error in transaction updateVoicePoints', err.stack);
			      client.query('ROLLBACK', (err) => {
			        if (err) {
			          console.error('Error rolling back client updateVoicePoints', err.stack);
			        }
			        // Release the client back to the pool
			        done();
			      });
			    }
			    return !!err;
			  }

			  client.query('BEGIN', (err) => {
			    if (shouldAbort(err)) {
			    	return;
			    }

			    client.query(
			    	'SELECT ' +
			    	(selfMute ? ' muted_timestamp::timestamp ' : ' unmuted_timestamp::timestamp ') +
			    	'FROM users WHERE discord_id = $1 AND ' + (selfMute ? ' muted_timestamp ' : ' unmuted_timestamp ') +
			    	'IS NOT NULL ORDER BY (year, week) DESC LIMIT 1',
						[queryParams[0]], (err, res) => {
				      if (shouldAbort(err)) {
				      	return;
				      } else if (res.rows.length === 0) {
								var totalSeconds = 0;
							} else {
								var endTimestamp = res.rows[0];
								endTimestamp = (selfMute ? endTimestamp.muted_timestamp : endTimestamp.unmuted_timestamp) + '';
								endTimestamp = new Date(endTimestamp);
								var totalSeconds = Math.floor((dateUTC - endTimestamp) / 1000);

								if (totalSeconds < 0) {
									totalSeconds = 0;
								} else if (totalSeconds > 60) {
									totalSeconds = 60;
								}
							}

							// Add total seconds in voice channel at the beginning of the array
							queryParams.push(totalSeconds);
							
				      client.query(
			        	'INSERT INTO users (discord_id, username, discriminator, avatar, characters_count, week, year, voice_points, ' +
			        	(selfMute ? 'seconds_muted, muted_timestamp' : 'seconds_unmuted, unmuted_timestamp') + ') ' +
			     			'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, timezone(\'utc\'::text, now())) ' +
			     			'ON CONFLICT (discord_id, week, year) DO UPDATE SET ' +
			     			'voice_points = users.voice_points + $8, ' +
			     			(selfMute ? 'seconds_muted = users.seconds_muted ' : 'seconds_unmuted = users.seconds_unmuted ') +
			     			' + $9, ' +
			     			(selfMute ? 'muted_timestamp ' : 'unmuted_timestamp ') +
								'= timezone(\'utc\'::text, now());',
								queryParams, (err, res) => {
				        if (shouldAbort(err)) {
				        	return;
				        }
				        client.query('COMMIT', (err) => {
				          if (err) {
				            console.error('Error committing transaction', err.stack);
				          }
				          done();
				        });
				      });
				    }
				  );
		    });
			});
			});
		});
	},

	//Gets role of a member based on the const snaxRoles
	getMemberRole: function (member) {
		var memberRole = {
			"name" : "",
			"emoji" : "",
		};
		if (member !== '') {
			member.roles.filter(function(role) {
				var roleIndex = config.snaxRoles.findIndex(i => i.name == role.name.replace(/[^a-z0-9 ,.?!]/ig, '').trim());
				if (roleIndex !== -1) {
					if (memberRole.name == '') {
						memberRole.name = role.name.replace(/[^a-z0-9 ,.?!]/ig, '').trim();
						memberRole.emoji = config.snaxRoles[roleIndex].emoji;
					} else {
						if (roleIndex < config.snaxRoles.findIndex(i => i.name == memberRole.name)) {
							memberRole.name = role.name.replace(/[^a-z0-9 ,.?!]/ig, '').trim();
							memberRole.emoji = config.snaxRoles[roleIndex].emoji;
						}
					}
				}
			});
		}
		return memberRole;
	},

	// SNAX CLUB game
	// Fight Profile: Level, XP, Games, Wins, Losses, Stats, Abilities

	// Attack, Block, Sneaky (Rock, Paper, Scissors style)
	// Winner of that round can choose what ability to use

	// Experience
	// 5 XP - Lvl 2
	// 15 XP - Lvl 3

	// Gain 5 XP per win and 2 per loss
	// Learn new ability every 5 levels

	// Stats:
	// 	HP
	// 	Accuracy
	// 	Damage
	// 	Defense
	// 	Dodge

	// Member will challenge another member to fight (.fight @member)
	// The other member has to type .accept to accept the challenge
	// The bot sends a direct message to each member with URL to the fight and with a code to enter the fight
	// The code is different for each member and stored as a cookie to be used to identify each player turn.
	// Fight in webpage updating with ajax with url snax-bonobot.herokuapp.com/fight/id=1 or /fight/1

	snaxClubGame: function(message, pool, Discord, richEmbed) {
		if (message.channel.name !== 'snax-bonobot') {
			message.reply(createEmbed(
				[':warning: Please run SNAX CLUB game in #snax-bonobot channel to avoid spam.']
			));
			return;
		}

		// Save challenged player
		let challenger = message.mentions.users.first();
		if (typeof challenger === 'undefined') { //If no mention was made
			message.channel.send(
				'**<:snax:230458568497692673> | <@' + message.author.id + '>, you need to mention at least one member to fight with!'
			);
			return;
		} else if (challenger.id == message.author.id) {
			message.channel.send(
				'**<:snax:230458568497692673> | <@' + message.author.id + '>, suicide is not allowed!'
			);
			return;
		} else {
			pool.connect((err, client, done) => {
			  	const shouldAbort = (err) => {
				    if (err) {
						console.error('Error in snaxclub transaction', err.stack);
						client.query('ROLLBACK', (err) => {
							if (err) {
							  	console.error('Error rolling back client', err.stack);
							}
							// Release the client back to the pool
							done();
						});
				    }
				    return !!err;
		  		}

			  	client.query('BEGIN', (err) => {
			    	if (shouldAbort(err)) {
			    		return;
			    	}

			    	// Check if challenged player has a character created
		    	    client.query(
		    		    'SELECT player_discord_id, character_info FROM snaxclub_players WHERE player_discord_id = $1 OR player_discord_id = $2',
		    		    [message.author.id, challenger], (err, res) => {
		    	      		if (shouldAbort(err)) {
		    	      			message.reply(createEmbed(
		    	      				[':boom: An error occurred!']
		    	      			));
		    	      			return;
		    	      		} else if (res.rows.length === 0 || (res.rows.length === 1 && res.rows[0].player_discord_id != message.author.id)) { // Challenger doesn't have a character created
		    	      			message.channel.send(
		    	      				'**<:snax:230458568497692673>  | <@' + message.author.id + '>, you still need to create a character to fight!\nType ```!snax club create``` to create your character.'
		    	      			);
		    	      			return;
		    	      		} else if (res.rows.length === 1 && res.rows[0].player_discord_id == message.author.id) { // Challenged doesn't have a character created
		    	      			message.channel.send(
		    	      				'**<:snax:230458568497692673>  | <@' + message.author.id + '>, ' + challenger.username + ' still needs to create a character to fight!\n<@' + challenger.id + '>, if you want to create your character type ```!snax club create```'
		    	      			);
		    	      			return;
		    	      		} else {
		    	      			// Check if player still has a challenge open
		    	      			if (utils.snaxClub.openChallenges.hasOwnProperty(message.author.username)) {
		    	      				message.channel.send(
		    	      					'**<:snax:230458568497692673>  | <@' + message.author.id + '>, you have to wait for **' + utils.snaxClub.openChallenges[message.author.username] + '** to accept your challenge!'
		    	      				);
		    	      				return;
		    	      			}

		    	      			// Add challenged username to open challenges
		    	      			utils.snaxClub.openChallenges[message.author.username] = challenger.username;

		    	      			// Send an embed instead with character stats
		    	      			message.channel.send(
		    	      				'**<:snax:230458568497692673>  | <@' + challenger.id + '>\n**' + message.author.username + '** has challenged you to a fight!\nDo you have what it takes to take him down!? You have 10 minutes to accept his challenge.\n```css\nType .accept to accept his challenge.```'
		    	      			);
		    	      			let embed = createSnaxClubFightEmbed(richEmbed, res.rows[0].character_info, res.rows[1].character_info);
		    	      			message.channel.send({
		    	      				embed
		    	      			});

		    	      			const filter = message => message.content.trim().toLowerCase() === '.accept';
		    	      			// Create a message collector
		    	      			const collector = new Discord.MessageCollector(channel, filter, { time: 600000 });
		    	      			collector.on('collect', (m) => {
		    	      				for (key in utils.snaxClub.openChallenges) {
		    	      					if (utils.snaxClub.openChallenges[key] == m.author.username) {
		    	      					    client.query( //Check if any player still has a battle active
		    	      						    'SELECT * FROM snaxclub_battles WHERE player1_discord_id = $1 OR player2_discord_id = $2 WHERE battle_active = TRUE',
		    	      						    [m.author.id, m.author.id], (err, res) => {
		    	      					      		if (shouldAbort(err)) {
		    	      					      			message.reply(createEmbed(
		    	      					      				[':boom: An error occurred!']
		    	      					      			));
		    	      					      			return;
		    	      					      		} else if (res.rows.length !== 0) { // Battle active
		    	      									message.reply(createEmbed(
		    	      										['You still have a battle to finish with' + (res.rows[0].player1_discord_id == m.author.id ? res.rows[0].player2_discord_id : res.rows[0].player1_discord_id) + '!']
		    	      									));
		    	      								} else { // No battle active
		    	      									// Remove open challenge after accepting and insert new battle in database
		    	      									delete utils.snaxClub.openChallenges[key];
		    	      							      	client.query(
		    	      								    	'INSERT INTO snaxclub_battles (player1_code, player2_code, player1_discord_id, player2_discord_id) VALUES ($1, $2, $3, $4)',
		    	      										[makeBattleCode(), makeBattleCode(), message.author.id, m.author.id], (err, res) => {

		    	      								          	// var embed = createProfileEmbed(richEmbed, user, queryLabel);
		    	      								          	// message.channel.send({
		    	      								          	// 	embed
		    	      								          	// }).catch(err => console.log(err));

		    	      							        		client.query('COMMIT', (err) => {
		    	      								          		if (err) {
		    	      								            		console.error('Error committing transaction', err.stack);
		    	      									         	}
		    	      								         		done();
		    	      								        	});
		    	      							      		}
		    	      							      	);

		    	      									// var embed = createStatsEmbed(richEmbed, res.rows, queryLabel, pointsType);
		    	      									// message.channel.send({
		    	      									// 	embed
		    	      									// });
		    	      								}
		    	      						    }
		    	      						);
		    	      						break;
		    	      					}
		    	      				}
		    	      			});

		    	      			collector.on('end', (collected) => {
		    	      			});
		    	      		}
		    	      	}
		    	    );
		    	});
			});
		}
	}
}

// Create embed with random description
// @param descriptions array
function createEmbed(descriptions) {
	var embed =	{
		embed: {
			color: 0x0074e8,
			description: descriptions[Math.floor(Math.random() * descriptions.length)]
		}
	};
	return embed;
}

// Create profile embed to show user info
// @param richEmbed Object
// @param properties Object
function createProfileEmbed(richEmbed, properties, type) {
	properties.valid_messages_count = parseInt(properties.valid_messages_count);
	properties.valid_characters_count = parseInt(properties.valid_characters_count);
	properties.dailies = parseInt(properties.dailies);
	var role = module.exports.getMemberRole(properties.member);

	richEmbed.setURL(encodeURI('https://snax-bonobot.herokuapp.com/member/' + properties.username));
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(properties.username + '  |  ' + role.emoji + ' ' + role.name);
	richEmbed.setDescription('*SNAXKREW Profile - ' + 
		(type === 'month' ? 'Last 4 Weeks' :
		(type === 'all_time' ? 'All Time' : 
		(type === 'week' ? 'Current Week' : 
		(type === 'last_week' ? 'Last Week' : '')))) + '*'
	);

	if (properties.avatar !== '') {
		richEmbed.setThumbnail(properties.avatar.replace('size=2048', 'width=60&height=60'));
	}

	if (properties.username == config.topMembers.text) {
		var date = new Date();
		date.setMonth(date.getMonth() - 1);
		richEmbed.addField('**:envelope: Text Champion :trophy:**', 'Most Active User in :envelope: Text Channels of ' + date.toLocaleString('en-us', { month: "long" }));
	}

	if (properties.username == config.topMembers.voice) {
		var date = new Date();
		date.setMonth(date.getMonth() - 1);
		richEmbed.addField('**:microphone2: Voice Champion :trophy:**', 'Most Active User in :microphone2: Voice Channels of ' + date.toLocaleString('en-us', { month: "long" }));
	}

	if (config.topMembers.dailies.includes(properties.username)) {
		var date = new Date();
		date.setMonth(date.getMonth() - 1);
		richEmbed.addField('**<:doublerainbow:335619664442818562> Dailies Champion :trophy:**', 'User with Most <:doublerainbow:335619664442818562> Dailies of ' + date.toLocaleString('en-us', { month: "long" }));
	}

	if (config.topMembers.reputation.includes(properties.username)) {
		var date = new Date();
		date.setMonth(date.getMonth() - 1);
		richEmbed.addField('**<:cookie:285277471094472716> Reputation Champion :trophy:**', 'User with Most <:cookie:285277471094472716> Reputation of ' + date.toLocaleString('en-us', { month: "long" }));
	}

	if (properties.member.presence.game !== null && !properties.member.user.bot &&
	    properties.member.presence.game.name.length < 50 && config.blockedStatus.indexOf(properties.member.presence.game.name) === -1) {
		richEmbed.addField('Playing Right Now :joystick:', properties.member.presence.game.name);
	}

	// richEmbed.addField('SNAXKREW Rank ' + role.emoji, role.name, true);
	richEmbed.addField('Text Points <:kfc:296050563374776320>', calculateTextPoints(properties.valid_messages_count, properties.valid_characters_count, properties.dailies), true);
	richEmbed.addField('Voice Points <:kfc:296050563374776320>', calculateVoicePoints(properties.seconds_unmuted, properties.seconds_muted, properties.voice_points, properties.dailies), true);
	richEmbed.addField('Messages Sent :incoming_envelope:', properties.messages_count, true);
	richEmbed.addField('Minutes Speaking :microphone2:', Math.floor(properties.seconds_unmuted / 60), true);
	// richEmbed.addField('Chars/Msgs Ratio :pencil:', (properties.characters_count / properties.valid_messages_count).toFixed(2), true);
	richEmbed.addField('Characters Sent :keyboard:', properties.characters_count, true);
	richEmbed.addField('Minutes Muted :mute:', Math.floor(properties.seconds_muted / 60), true);
	richEmbed.addField('Dailies <:doublerainbow:335619664442818562>', properties.dailies / 20, true);
	richEmbed.addField('Reputation <:cookie:285277471094472716>', properties.reputation, true);
	// richEmbed.setFooter('snax-bonobot', 'http://www.snaxkrew.com/snaxkrew/imgs/snaxbanner.png');

	return richEmbed;
}

// Create stats embed to show most active leaderboard
// @param richEmbed Object
// @param users Object
// @param type String
// @param pointsType String
function createStatsEmbed(richEmbed, users, type, pointsType) {	
	var emoji = (pointsType == 'text' ? ':envelope:' :
							(pointsType == 'voice' ? ':microphone2:' :
							(pointsType == 'dailies' ? '<:doublerainbow:335619664442818562>' :
							(pointsType == 'rep' ? '<:cookie:285277471094472716>' : ':trophy:'))));

	richEmbed.setColor(0x0074e8);

	if (pointsType !== 'dailies' && pointsType !== 'rep') {
		richEmbed.setTitle(emoji +
			' Most Active Users of ' + 
			(type === 'month' ? 'the Month ' :
			(type === 'all_time' ? 'All Time ' : 
			(type === 'week' ? 'the Week ' : 
			(type === 'last_week' ? 'Last Week ' : '')))) +
			emoji
		);
		richEmbed.setDescription('*Based on Activity in ' + 
			(pointsType == 'text' ? 'Text Channels' : (pointsType == 'voice' ? 'Voice Channels' : 'All SNAXKREW Channels')) +
			(type === 'month' ? ' - Last 4 Weeks*' : '*')
		);
	} else {
		richEmbed.setTitle(emoji +
			' Users with Most ' + (pointsType == 'dailies' ? 'Dailies' : 'Reputation') + ' of ' + 
			(type === 'month' ? 'the Month ' :
			(type === 'all_time' ? 'All Time ' : 
			(type === 'week' ? 'the Week ' : 
			(type === 'last_week' ? 'Last Week ' : '')))) +
			emoji
		);
		richEmbed.setDescription('*Based on SNAXKREW Members Activity' + (type === 'month' ? ' - Last 4 Weeks*' : '*'));
	}

	// Add 9 most active users to richEmbed
	for (var i = 0; i < users.length; i++) {
		var podium = config.rankingEmojis[i];
		richEmbed.addField(podium + ' ' + users[i].username,
			(pointsType == 'dailies' ? (users[i].dailies / 20) + ' <:doublerainbow:335619664442818562>' :
			(pointsType == 'rep' ? users[i].reputation + ' <:cookie:285277471094472716>' : users[i].points + ' <:kfc:296050563374776320>')), true);
	};
	// richEmbed.setFooter('snax-bonobot', 'http://www.snaxkrew.com/snaxkrew/imgs/snaxbanner.png');

	return richEmbed;
}

// Create most played games embed
// @param richEmbed Object
// @param gamesPlayed array(Object)
function createMostPlayedGamesEmbed(richEmbed, gamesPlayed) {	
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(':joystick: Most Played Games of the Day :joystick:');
	richEmbed.setDescription('*Based on SNAX Members*');

	// Useful to print
	gamesPlayed.forEach((element, i) => {
		let podium = config.rankingEmojis[i];

		element.users.usernames.sort(function(a, b){
			let usernameA = a.toLowerCase(), usernameB = b.toLowerCase();
			if (usernameA < usernameB) { //sort string ascending
				return -1;
			}
			if (usernameA > usernameB) {
				return 1;
			}
			return 0; //default return value (no sorting)
		});

		let usernames = element.users.usernames.shift();
		element.users.usernames.forEach((username, i) => {
			usernames += ' | ' + username;
		});

		richEmbed.addField(
			podium + ' ' + element.game + ' ( ' + element.users.count + ' Player' + (element.users.count > 1 ? 's' : '') + ' )',
			'```css\n' + usernames + '```', true
		);
	});

	// richEmbed.setFooter('snax-bonobot', 'http://www.snaxkrew.com/snaxkrew/imgs/snaxbanner.png');

	return richEmbed;
}

// Create playing games embed
// @param richEmbed Object
// @param membersPlaying a game array(Object)
function createPlayingEmbed(richEmbed, membersPlaying, game) {	
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(':joystick: Members playing ' + game + '  :joystick:');

	let description = '```css\n';
	// Add 9 most played games to richEmbed
	membersPlaying.forEach(function(member, i) {
		description += (i ? ' | ' : '') + member.user.username;
	});
	description += '\n```';
	richEmbed.setDescription(description);
	// richEmbed.setFooter('snax-bonobot', 'http://www.snaxkrew.com/snaxkrew/imgs/snaxbanner.png');

	return richEmbed;
}

// Create podium embed to show podium for last 4 weeks
// @param richEmbed Object
// @param users Object
// @param pointsType String
function createPodiumEmbed(richEmbed, users, pointsType, image) {	
	var emoji = (pointsType == 'text' ? ':envelope:' : (pointsType == 'voice' ? ':microphone2:' : ':trophy:'));
	var date = new Date(); 
	date.setHours(date.getHours() - 24);
	
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(emoji +
		' Podium of ' + date.toLocaleString("en-us", { month: "long" }) + ' ' +
		emoji
	);
	richEmbed.setDescription('*Based on Activity in ' + 
		(pointsType == 'text' ? 'Text Channels' : (pointsType == 'voice' ? 'Voice Channels' : 'All SNAXKREW Channels')) +
		' - Last 4 Weeks*'
	);
	richEmbed.setImage(image);

	// Add 3 most active users to richEmbed
	for (var i = 0; i < users.length; i++) {
		var podium = (i == 0 ? ':trophy:' : config.rankingEmojis[i]);
		if (i == 0) {
			richEmbed.addField('<:snax:230458568497692673>', '<:snax:230458568497692673>', true);
		} else if (i == 2) {
			richEmbed.addField('<:snax:230458568497692673>', '<:snax:230458568497692673>', true);
		}

		richEmbed.addField(podium + ' ' + users[i].username, (pointsType == 'voice' ? users[i].voicePoints : users[i].textPoints) + ' <:kfc:296050563374776320>', true);

		if (i == 0) {
			richEmbed.addField('<:snax:230458568497692673>', '<:snax:230458568497692673>', true);
		}
	};
	// richEmbed.setFooter('snax-bonobot', 'http://www.snaxkrew.com/snaxkrew/imgs/snaxbanner.png');
	return richEmbed;
}

// Create meme embed to show memes from reddit in meme cahnnel
// @param richEmbed Object
// @param properties Object
function createMemeEmbed(richEmbed, properties) {
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(properties.title);
	richEmbed.setURL(encodeURI(properties.url));
	richEmbed.setDescription('<:teehee:335621295448260608> Hot Meme! <:teehee:335621295448260608>');
	richEmbed.setImage(properties.url);
	return richEmbed;
}

// Create stream embed to show users that just started streaming on twitch.tv
// @param richEmbed Object
// @param member Object
function createStreamEmbed(richEmbed, member) {
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(member.user.username + ' just started streaming!');
	richEmbed.setURL(encodeURI(member.presence.game.url));
	richEmbed.setDescription('**:tv: ' + member.presence.game.name + ' :tv:**\n<:feelsgoodman:284450372716855297> Watch the stream at ' + encodeURI(member.presence.game.url));
	richEmbed.setThumbnail(member.user.displayAvatarURL.replace('size=2048', 'width=60&height=60'));
	return richEmbed;
}

// Create SNAX CLUB character embed
// @param richEmbed Object
// @param character Object
function createSnaxClubCharacterEmbed(richEmbed, character) {	
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(':joystick: Character Name (Owner) :joystick:');
	richEmbed.setDescription('*Level ' + character.level + '*');

	richEmbed.addField('**HP**', character.hp, true);
	richEmbed.addField('**XP**', character.xp + ' / ' + character.level * xp, true);
	richEmbed.addField('**Attack**', character.attack, true);
	richEmbed.addField('**Defense**', character.defense, true);
	richEmbed.addField('**Dodge**', character.dodge, true);

	// richEmbed.setFooter('snax-bonobot', 'http://www.snaxkrew.com/snaxkrew/imgs/snaxbanner.png');

	return richEmbed;
}

// Create SNAX CLUB character embed
// @param richEmbed Object
// @param character1 Object
// @param character2 Object
function createSnaxClubFightEmbed(richEmbed, character1, character2) {	
	richEmbed.setColor(0x0074e8);
	richEmbed.setTitle(':joystick: ' + character1.username + ' VS ' + character2.username + ' :joystick:');
	richEmbed.setDescription('*Fighters Stats*');

	let statWinner = {
		level: character1.level > character1.level,
		hp: character1.hp > character2.hp,
		attack: character1.attack > character2.attack,
		defense: character1.defense > character2.defense,
		dodge: character1.dodge > character2.dodge,
	};

	// Player 1
	richEmbed.addField('**' + character1.username +
		'**\nLevel: ' + character1.level + (statWinner.level ? ' :arrow_up:' : ' :arrow_down:') +
		'\nHP: ' + character1.hp + (statWinner.hp ? ' :arrow_up:' : ' :arrow_down:') +
		'\nAttack: ' + character1.attack + (statWinner.attack ? ' :arrow_up:' : ' :arrow_down:') +
		'\nDefense: ' + character1.defense + (statWinner.defense ? ' :arrow_up:' : ' :arrow_down:') +
		'\nDodge: ' + character1.dodge + (statWinner.dodge ? ' :arrow_up:' : ' :arrow_down:'),
	true);

	// Player 2
	richEmbed.addField('**' + character2.username +
		'**\nLevel: ' + character2.level + (!statWinner.level ? ' :arrow_up:' : ' :arrow_down:') +
		'\nHP: ' + character2.hp + (!statWinner.hp ? ' :arrow_up:' : ' :arrow_down:') +
		'\nAttack: ' + character2.attack + (!statWinner.attack ? ' :arrow_up:' : ' :arrow_down:') +
		'\nDefense: ' + character2.defense + (!statWinner.defense ? ' :arrow_up:' : ' :arrow_down:') +
		'\nDodge: ' + character2.dodge + (!statWinner.dodge ? ' :arrow_up:' : ' :arrow_down:'),
	true);
	


	// richEmbed.setFooter('snax-bonobot', 'http://www.snaxkrew.com/snaxkrew/imgs/snaxbanner.png');

	return richEmbed;
}

// Calculate SNAX points
// 1 Message = 2 Points
// 1 Character = 0.05 points (Max = Messages * 4)
// If Messages >= 100 then 1% Characters/Message ratio = 1 Point (Max = 25)
// @param messages_count int
// @param characters_count int
function calculateTextPoints(valid_messages_count, valid_characters_count, dailies) {
	valid_messages_count = parseInt(valid_messages_count);
	valid_characters_count = parseInt(valid_characters_count);
	dailies = parseInt(dailies);
	return parseInt(((valid_messages_count * 5) +
		(Math.min(valid_characters_count / 20, valid_messages_count * 4) * 2)
	).toFixed(0)) + dailies;
}

function calculateVoicePoints(seconds_unmuted, seconds_muted, voice_points, dailies) {
	dailies = parseInt(dailies);
	return parseInt(((Math.floor(seconds_muted / 60) * 0.5) +
		(Math.floor(seconds_unmuted / 60) * 1) +
		Math.floor(voice_points)
	).toFixed(0)) + dailies;
}

// Processes help command
function processHelpCommand(message, command) {
	let helpText = '';
	if (command === 'sounds' || command === 'all') {
		helpText += '\n:notes: **Sound Commands** :notes:\n *Bot joins your voice channel and plays a sound.*\n\n';
		helpText += 'Type `!snax` followed by the sound name:\n';
		helpText += '```css\n'; //Open multi-line code block

		if (command !== 'sounds') {
			config.sounds.slice(0, 25).forEach(function(element){
				helpText += element + ' | '
			});
		} else {
			config.sounds.forEach(function(element){
				helpText += element + ' | '
			});
		}

		helpText += '```'; //Close multi-line code block
		helpText += '\nType `!snax sounds help` for the full list.';
		helpText += '\n*(Do you have a sound suggestion? Talk to one of the members with Champion role!)*\n\n';
	}

	if (command === 'profile' || command === 'all') {
		helpText += '\n:clipboard: **Profile Command** :clipboard:\n *Check your SNAXKREW profile with activity stats since you joined the server.*\n';
		helpText += '```\n';
		helpText += '!snax profile\n';
		helpText += '!snax profile username|@mention\n';
		helpText += '!snax profile week|last_week|month|all_time\n';
		helpText += '```\n';
	}

	if (command === 'stats' || command === 'all') {
		helpText += '\n:trophy: **Stats Command** :trophy:\n *Check most active members in SNAXKREW server!*\n';
		helpText += '```\n';
		helpText += '!snax stats\n';
		helpText += '!snax stats text|voice|dailies|rep\n';
		helpText += '!snax stats week|last_week|month|all_time\n';
		helpText += '```\n';
	}

	if (command === 'dailies' || command === 'all') {
		helpText += '\n<:doublerainbow:335619664442818562> **Dailies Command** <:doublerainbow:335619664442818562>\n *Get your daily <:kfc:296050563374776320> 20 SNAX points!*\n';
		helpText += '```\n';
		helpText += '.dailies\n';
		helpText += '```\n';
	}

	if (command === 'rep' || command === 'all') {
		helpText += '\n<:cookie:285277471094472716> **Reputation Command** <:cookie:285277471094472716>\n *Give reputation to your favorite SNAXKREW members! The higher your role, the more reputation you can give!*\n';
		helpText += '```\n';
		helpText += '.rep @mention1 @mention2\n';
		helpText += '```\n';
	}

	message.channel.send(
		helpText
	);

	helpText = '';

	if (command === 'playing' || command === 'all') {
		helpText += '\n:joystick: **Playing Command** :joystick:\n *See what members are playing a specific game!*\n';
		helpText += '```\n';
		helpText += '.playing Atlas Reactor\n';
		helpText += '```\n';
	}

	if (command === 'race' || command === 'all') {
		helpText += '\n:race_car: **Race Game** :race_car:\n *Compete in a race with your friends!*\nTo start the race:';
		helpText += '```\n';
		helpText += '.race\n';
		helpText += '```\n';
		helpText += 'To join the race:\n';
		helpText += '```\n';
		helpText += '.join\n';
		helpText += '```\n';
	}

	if (command === 'stop' || command === 'all') {
		helpText += '\n:stop: **Stop Command** :stop:\n *Stop playing my annoying long sounds!*\n';
		helpText += '```\n';
		helpText += '.stop\n';
		helpText += '```\n';
		helpText += '\n*(You need to be in same voice channel where the bot is playing the sound)*\n\n';
	}

	if (command === 'club' || command === 'all') {
		helpText += '\n:stop: **SNAX CLUB Command** :stop:\n *Create your character and fight against other SNAXKREW members!*\n';
		helpText += '```\n';
		helpText += '!snax club create\n';
		helpText += '```\n';
		helpText += 'Challenge other members:\n';
		helpText += '```\n';
		helpText += '.fight @mention1\n';
		helpText += '```\n';
		helpText += 'view other members characters:\n';
		helpText += '```\n';
		helpText += '!snax club @mention1\n';
		helpText += '```\n';
		helpText += '\n';
	}

	message.channel.send(
		helpText
	);
}

// Gets week of the year
function getWeekOfYear(date) {
	var copyDate = new Date(date.valueOf());
  var dayNr = (copyDate.getDay() + 6) % 7;
  copyDate.setDate(copyDate.getDate() - dayNr + 3);
  var firstThursday = copyDate.valueOf();
  copyDate.setMonth(0, 1);
  if (copyDate.getDay() !== 4) {
      copyDate.setMonth(0, 1 + ((4 - copyDate.getDay()) + 7) % 7);
  }
  var retVal = 1 + Math.ceil((firstThursday - copyDate) / 604800000);

  return (retVal < 10 ? retVal : retVal);
}

//Gets total number of weeks in a year
function getISOWeeks(year) {
  var d, isLeap;

  d = new Date(year, 0, 1);
  isLeap = new Date(year, 1, 29).getMonth() === 1;

  //check for a Jan 1 that's a Thursday or a leap year that has a 
  //Wednesday jan 1. Otherwise it's 52
  return d.getDay() === 4 || isLeap && d.getDay() === 3 ? 53 : 52
}

//Gets total number of weeks in a year
function getLast4WeeksQuery() {
  var date = new Date();
	var dateUTC = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
	var maxWeek = getWeekOfYear(dateUTC);
	var minWeek = maxWeek - 3;
	var year = dateUTC.getFullYear();
	var where = " week >= " + minWeek + " AND week <= " + maxWeek + " AND year = " + year + " ";
	// If last 4 weeks starts on previous year
	if (minWeek < 1) {
		minWeek = getISOWeeks(dateUTC.getFullYear() - 1) - 2;
		where = " (week >= " + minWeek + " AND year = " + (year - 1) + " OR week <= " + maxWeek + " AND year = " + year + ") ";
	}

	return where;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function makeBattleCode() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

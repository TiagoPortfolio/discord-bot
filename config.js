var config = {};

config.token = '';

// Used in processSoundCommand. botAvailable = false if is playing a sound
config.botAvailable = true;

// Used in race game
config.raceInProgress = false;

// Used in hangman game
config.hangmanInProgress = false;

// Available sounds
config.sounds = [
	'ahah', 'ahgay', 'applepen', 'babywaa', 'badfeeling', 'bamboozled', 'beatdrop', 'beatdrop2', 'beatdrop3', 'beatdrop4',
	'birthday', 'bodyvsmind', 'bye', 'cantbelieve', 'cartoon', 'carried', 'champions', 'conga',	'crickets', 'damnson',
	'denied', 'dejavu', 'drumroll', 'dundunduunn', 'easy', 'entertained', 'epic', 'existence', 'gameofthrones', 'gas', 'gg', 'goodbye',
	'goteem', 'hallelujah', 'heartbeat', 'heaven', 'hello', 'hello2', 'hello3', 'heylisten', 'hitme', 'iambad', 'iamdanger', 'iamfine',
	'iamtheone', 'ifeelgood', 'illbeback', 'jason', 'jesus', 'juggernaut', 'lag', 'lame', 'lame2', 'legendsneverdie', 'legit', 'lying',
	'mgsalert', 'monkey', 'nani', 'nevergiveup', 'nice', 'no', 'noice', 'nope', 'notevenclose', 'onlytime', 'quack', 'quickmaths', 'reloading',
	'retardalert', 'run', 'sadmusic', 'sadmusic2', 'sadmusic3', 'sauce', 'scratch', 'scream', 'scream2', 'scream3', 'seduction',
	'seduction2', 'seduction3', 'shoother', 'slowmo', 'smokeweed', 'spaghet', 'surprise', 'suspense', 'suspense2',	'suspenseepic',
	'thatsgood', 'tobecontinued', 'tralala', 'troll', 'troll2', 'tunak', 'turndownforwhat', 'tybitch', 'tysmd','victory',
	'victory2',	'victory3', 'victory_long', 'wae',	'whatshesaid', 'whyumad', 'wow', 'xfiles', 'yeah', 'yeet', 'ymca'
];

// Available sound error descriptions
config.soundErrorDescriptions = [
	'You need to be in a voice channel if you want to hear the sound you bonobo! :face_palm:',
	':sweat_drops: :sweat_drops: That\'s what you get for not being in a voice channel when trying to play a sound!',
	'How do you expect me to play the sound to you if you are not in a voice channel :interrobang:'
];

config.reputationLimit = {
	'Officer' : 5,
	'Champion' : 5,
	'Elite' : 4,
	'Core' : 3,
	'Recruit' : 2,
	'Initiate' : 1
};

config.snaxRoles = [
	{name : 'Officer',  emoji: ':fleur_de_lis:'},
	{name : 'Champion', emoji: ':trophy:'},
	{name : 'Elite', 	emoji: ':trident:'},
	{name : 'Core',		emoji: ':crossed_swords:'},
	{name : 'Recruit',  emoji: ':military_medal:'},
	{name : 'Initiate', emoji: ':beginner:'}
];

config.availableRoles = [
	'atlas reactor',
	'battlerite',
	'dota 2',
	'fun club',
	'hots',
	'hearthstone',
	'league of legends',
	'overwatch',
	'pubg',
	'path of exile',
	'rb6 siege',
	'rocket league',
	'smite',
	'tabletop sim',
	'warframe',
	'wow',
	'fapper',
];

config.popularGames = [
	'osu!',
	'War Thunder',
	'PAYDAY 2',
	'Sid Meier\'s Civilization V',
	'Borderlands 2',
	'Blood Bowl 2',
	'Terraria',
	'Fortnite',
	'Shadowverse',
	'Elder Scrolls Legends',
	'DayZ',
	'Absolver',
	'Battlerite',
	'Paladins: Champions of the Realm',
	'World of Warcraft',
	'Gigantic',
	'Strife',
	'Counter-Strike Global Offensive',
	'XCOM 2',
	'SMITE',
	'Heroes of the Storm',
	'League of Legends',
	'Guild Wars 2',
	'Divinity Original Sin 2',
	'Tabletop Simulator',
	'Overwatch',
	'PUBG',
	'Atlas Reactor',
	'Rocket League'
];

config.blockedStatus = [
	'Commiting Suicide brb',
	'nmrih',
	'OfRetardsAndMe',
	'Is That Him?',
	'Dolphin',
	'The Feeder TULCE :muscle:',
	'With ur mum',
	'Spotify',
];

config.rankingEmojis = [
	':first_place:', ':second_place:', ':third_place:',
	':four:', ':five:', ':six:', ':seven:', ':eight:',
	':nine:', ':one::zero:', ':one::one:', ':one::two:',
	':one::three:', ':one::four:', ':one::five:', ':one::six:',
	':one::seven:', ':one::eight:', ':one::nine:', ':two::zero:'
];

config.topMembers = {
	'text'		: 'Noon Onyx',
	'voice' 	: 'Ashjacky',
	'dailies'  	: ['Smacks'],
	'reputation': ['Feedia']
};

config.snaxClub = {
	openChallenges : []
};

config.racePlayers = [
	{
		avatar : '<:arctic_wat:325850477109575691>',
		board  : '\n:vertical_traffic_light:|<:arctic_wat:325850477109575691>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:haha:334444953545605122>',
		board  : '\n:vertical_traffic_light:|<:haha:334444953545605122>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:dailure_isthatso:325850313452158996>',
		board  : '\n:vertical_traffic_light:|<:dailure_isthatso:325850313452158996>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:handsome_omar:325850491122614274>',
		board  : '\n:vertical_traffic_light:|<:handsome_omar:325850491122614274>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:coolstory_donjay:325849857321467916>',
		board  : '\n:vertical_traffic_light:|<:coolstory_donjay:325849857321467916>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:bonobojizz:320292029227728897>',
		board  : '\n:vertical_traffic_light:|<:bonobojizz:320292029227728897>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:kawaiipoop:296072782884896781>',
		board  : '\n:vertical_traffic_light:|<:kawaiipoop:296072782884896781>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:KappaPride:335587672653561856>',
		board  : '\n:vertical_traffic_light:|<:KappaPride:335587672653561856>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:kappa:230495935539576843>',
		board  : '\n:vertical_traffic_light:|<:kappa:230495935539576843>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:dongr:274322312453554176>',
		board  : '\n:vertical_traffic_light:|<:dongr:274322312453554176>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:PickleRick:331833044023508995>',
		board  : '\n:vertical_traffic_light:|<:PickleRick:331833044023508995>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:OmarPepe:324688036476616724>',
		board  : '\n:vertical_traffic_light:|<:OmarPepe:324688036476616724>------------------------------:checkered_flag:',
		points : 0
	},
	{
		avatar : '<:feelsgoodman:284450372716855297>',
		board  : '\n:vertical_traffic_light:|<:feelsgoodman:284450372716855297>------------------------------:checkered_flag:',
		points : 0
	},
];

config.hangmanWords = [
	'able', 'about', 'account', 'acid', 'across', 'act', 'addition', 'adjustment', 'advertisement', 'after', 'again', 'against', 'agreement', 'air', 'all',
	'almost', 'among', 'amount', 'amusement', 'and', 'angle', 'angry', 'animal', 'answer', 'ant', 'any', 'apparatus', 'apple', 'approval', 'arch',
	'argument', 'arm', 'army', 'art', 'as', 'at', 'attack', 'attempt', 'attention', 'attraction', 'authority', 'automatic', 'awake', 'baby', 'back', 'bad',
	'bag', 'balance', 'ball', 'band', 'base', 'basin', 'basket', 'bath', 'be', 'beautiful', 'because', 'bed', 'bee', 'before', 'behaviour', 'belief', 'bell',
	'bent', 'berry', 'between', 'bird', 'birth', 'bit', 'bite', 'bitter', 'black', 'blade', 'blood', 'blow', 'blue', 'board', 'boat', 'body', 'boiling',
	'bone', 'book', 'boot', 'bottle', 'box', 'boy', 'brain', 'brake', 'branch', 'brass', 'bread', 'breath', 'brick', 'bridge', 'bright', 'broken', 'brother',
	'brown', 'brush', 'bucket', 'building', 'bulb', 'burn', 'burst', 'business', 'but', 'butter', 'button', 'by', 'cake', 'camera', 'canvas', 'card', 'care',
	'carriage', 'cart', 'cat', 'cause', 'certain', 'chain', 'chalk', 'chance', 'change', 'cheap', 'cheese', 'chemical', 'chest', 'chief', 'chin', 'church',
	'circle', 'clean', 'clear', 'clock', 'cloth', 'cloud', 'coal', 'coat', 'cold', 'collar', 'colour', 'comb', 'come', 'comfort', 'committee', 'common',
	'company', 'comparison', 'competition', 'complete', 'complex', 'condition', 'connection', 'conscious', 'control', 'cook', 'copper', 'copy', 'cord', 'cork',
	'cotton', 'cough', 'country', 'cover', 'cow', 'crack', 'credit', 'crime', 'cruel', 'crush', 'cry', 'cup', 'cup', 'current', 'curtain', 'curve', 'cushion',
	'damage', 'danger', 'dark', 'daughter', 'day', 'dead', 'dear', 'death', 'debt', 'decision', 'deep', 'degree', 'delicate', 'dependent', 'design', 'desire',
	'destruction', 'detail', 'development', 'different', 'digestion', 'direction', 'dirty', 'discovery', 'discussion', 'disease', 'disgust', 'distance',
	'distribution', 'division', 'do', 'dog', 'door', 'doubt', 'down', 'drain', 'drawer', 'dress', 'drink', 'driving', 'drop', 'dry', 'dust', 'ear', 'early',
	'earth', 'east', 'edge', 'education', 'effect', 'egg', 'elastic', 'electric', 'end', 'engine', 'enough', 'equal', 'error', 'even', 'event', 'ever',
	'every', 'example', 'exchange', 'existence', 'expansion', 'experience', 'expert', 'eye', 'face', 'fact', 'fall', 'false', 'family', 'far', 'farm',
	'fat', 'father', 'fear', 'feather', 'feeble', 'feeling', 'female', 'fertile', 'fiction', 'field', 'fight', 'finger', 'fire', 'first', 'fish', 'fixed',
	'flag', 'flame', 'flat', 'flight', 'floor', 'flower', 'fly', 'fold', 'food', 'foolish', 'foot', 'for', 'force', 'fork', 'form', 'forward', 'fowl', 'frame',
	'free', 'frequent', 'friend', 'from', 'front', 'fruit', 'full', 'future', 'garden', 'general', 'get', 'girl', 'give', 'glass', 'glove', 'go', 'goat', 'gold',
	'good', 'government', 'grain', 'grass', 'great', 'green', 'grey', 'grip', 'group', 'growth', 'guide', 'gun', 'hair', 'hammer', 'hand', 'hanging', 'happy',
	'harbour', 'hard', 'harmony', 'hat', 'hate', 'have', 'he', 'head', 'healthy', 'hear', 'hearing', 'heart', 'heat', 'help', 'high', 'history', 'hole',
	'hollow', 'hook', 'hope', 'horn', 'horse', 'hospital', 'hour', 'house', 'how', 'humour', 'I', 'ice', 'idea', 'if', 'ill', 'important', 'impulse', 'in',
	'increase', 'industry', 'ink', 'insect', 'instrument', 'insurance', 'interest', 'invention', 'iron', 'island', 'jelly', 'jewel', 'join', 'journey', 'judge',
	'jump', 'keep', 'kettle', 'key', 'kick', 'kind', 'kiss', 'knee', 'knife', 'knot', 'knowledge', 'land', 'language', 'last', 'late', 'laugh', 'law', 'lead',
	'leaf', 'learning', 'leather', 'left', 'leg', 'let', 'letter', 'level', 'library', 'lift', 'light', 'like', 'limit', 'line', 'linen', 'lip', 'liquid',
	'list', 'little', 'living', 'lock', 'long', 'look', 'loose', 'loss', 'loud', 'love', 'low', 'machine', 'make', 'male', 'man', 'manager', 'map', 'mark',
	'market', 'married', 'mass', 'match', 'material', 'may', 'meal', 'measure', 'meat', 'medical', 'meeting', 'memory', 'metal', 'middle', 'military', 'milk',
	'mind', 'mine', 'minute', 'mist', 'mixed', 'money', 'monkey', 'month', 'moon', 'morning', 'mother', 'motion', 'mountain', 'mouth', 'move', 'much', 'muscle',
	'music', 'nail', 'name', 'narrow', 'nation', 'natural', 'near', 'necessary', 'neck', 'need', 'needle', 'nerve', 'net', 'new', 'news', 'night', 'no', 'noise',
	'normal', 'north', 'nose', 'not', 'note', 'now', 'number', 'nut', 'observation', 'of', 'off', 'offer', 'office', 'oil', 'old', 'on', 'only', 'open',
	'operation', 'opinion', 'opposite', 'or', 'orange', 'order', 'organization', 'ornament', 'other', 'out', 'oven', 'over', 'owner', 'page', 'pain', 'paint',
	'paper', 'parallel', 'parcel', 'part', 'past', 'paste', 'payment', 'peace', 'pen', 'pencil', 'person', 'physical', 'picture', 'pig', 'pin', 'pipe', 'place',
	'plane', 'plant', 'plate', 'play', 'please', 'pleasure', 'plough', 'pocket', 'point', 'poison', 'polish', 'political', 'poor', 'porter', 'position', 'possible',
	'pot', 'potato', 'powder', 'power', 'present', 'price', 'print', 'prison', 'private', 'probable', 'process', 'produce', 'profit', 'property', 'prose', 'protest',
	'public', 'pull', 'pump', 'punishment', 'purpose', 'push', 'put', 'quality', 'question', 'quick', 'quiet', 'quite', 'rail', 'rain', 'range', 'rat', 'rate',
	'ray', 'reaction', 'reading', 'ready', 'reason', 'receipt', 'record', 'red', 'regret', 'regular', 'relation', 'religion', 'representative', 'request', 'respect',
	'responsible', 'rest', 'reward', 'rhythm', 'rice', 'right', 'ring', 'river', 'road', 'rod', 'roll', 'roof', 'room', 'root', 'rough', 'round', 'rub', 'rule',
	'run', 'sad', 'safe', 'sail', 'salt', 'same', 'sand', 'say', 'scale', 'school', 'science', 'scissors', 'screw', 'sea', 'seat', 'second', 'secret', 'secretary',
	'see', 'seed', 'seem', 'selection', 'self', 'send', 'sense', 'separate', 'serious', 'servant', 'sex', 'shade', 'shake', 'shame', 'sharp', 'sheep', 'shelf',
	'ship', 'shirt', 'shock', 'shoe', 'short', 'shut', 'side', 'sign', 'silk', 'silver', 'simple', 'sister', 'size', 'skin', 'skirt', 'sky', 'sleep', 'slip', 'slope',
	'slow', 'small', 'smash', 'smell', 'smile', 'smoke', 'smooth', 'snake', 'sneeze', 'snow', 'so', 'soap', 'society', 'sock', 'soft', 'solid', 'some', 'son', 'song',
	'sort', 'sound', 'soup', 'south', 'space', 'spade', 'special', 'sponge', 'spoon', 'spring', 'square', 'stage', 'stamp', 'star', 'start', 'statement', 'station',
	'steam', 'steel', 'stem', 'step', 'stick', 'sticky', 'stiff', 'still', 'stitch', 'stocking', 'stomach', 'stone', 'stop', 'store', 'story', 'straight', 'strange',
	'street', 'stretch', 'strong', 'structure', 'substance', 'such', 'sudden', 'sugar', 'suggestion', 'summer', 'sun', 'support', 'surprise', 'sweet', 'swim',
	'system', 'table', 'tail', 'take', 'talk', 'tall', 'taste', 'tax', 'teaching', 'tendency', 'test', 'than', 'that', 'the', 'then', 'theory', 'there', 'thick',
	'thin', 'thing', 'this', 'thought', 'thread', 'throat', 'through', 'through', 'thumb', 'thunder', 'ticket', 'tight', 'till', 'time', 'tin', 'tired', 'to', 'toe',
	'together', 'tomorrow', 'tongue', 'tooth', 'top', 'touch', 'town', 'trade', 'train', 'transport', 'tray', 'tree', 'trick', 'trouble', 'trousers', 'true', 'turn',
	'twist', 'umbrella', 'under', 'unit', 'up', 'use', 'value', 'verse', 'very', 'vessel', 'view', 'violent', 'voice', 'waiting', 'walk', 'wall', 'war', 'warm', 'wash',
	'waste', 'watch', 'water', 'wave', 'wax', 'way', 'weather', 'week', 'weight', 'well', 'west', 'wet', 'wheel', 'when', 'where', 'while', 'whip', 'whistle', 'white',
	'who', 'why', 'wide', 'will', 'wind', 'window', 'wine', 'wing', 'winter', 'wire', 'wise', 'with', 'woman', 'wood', 'wool', 'word', 'work', 'worm', 'wound',
	'writing', 'wrong', 'year', 'yellow', 'yes', 'yesterday', 'you', 'young', 'Bernhard', 'Breytenbach', 'Android',	'arm', 'back', 'ears', 'eyes', 'face', 'feet',
	'fingers', 'foot', 'hair', 'hands', 'head', 'knees', 'legs', 'mouth', 'neck', 'nose', 'shoulders', 'skin', 'stomach', 'teeth', 'thumbs', 'toes', 'tongue', 'tooth',
	'black', 'blue', 'brown', 'gray', 'green', 'orange', 'pink', 'purple', 'red', 'white', 'yellow', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
	'Saturday', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
	'seventeen', 'eighteen', 'nineteen', 'twenty', 'abruptly', 'absurd', 'abyss', 'affix', 'askew', 'avenue', 'awkward', 'axiom', 'azure', 'bagpipes', 'bandwagon',
	'banjo', 'bayou', 'beekeeper', 'bikini', 'blitz', 'blizzard', 'boggle', 'bookworm', 'boxcar', 'boxful', 'buckaroo', 'buffalo', 'buffoon', 'buxom', 'buzzard',
	'buzzing', 'buzzwords', 'caliph', 'cobweb', 'cockiness', 'croquet', 'crypt', 'curacao', 'cycle', 'daiquiri', 'dirndl', 'disavow', 'dizzying', 'duplex', 'dwarves',
	'embezzle', 'equip', 'espionage', 'euouae', 'exodus', 'faking', 'fishhook', 'fixable', 'fjord', 'flapjack', 'flopping', 'fluffiness', 'flyby', 'foxglove',
	'frazzled', 'frizzled', 'fuchsia', 'funny', 'gabby', 'galaxy', 'galvanize', 'gazebo', 'giaour', 'gizmo', 'glowworm', 'glyph', 'gnarly', 'gnostic', 'gossip',
	'grogginess', 'haiku', 'haphazard', 'hyphen', 'iatrogenic', 'icebox', 'injury', 'ivory', 'ivy', 'jackpot', 'jaundice', 'jawbreaker', 'jaywalk', 'jazziest',
	'jazzy', 'jelly', 'jigsaw', 'jinx', 'jiujitsu', 'jockey', 'jogging', 'joking', 'jovial', 'joyful', 'juicy', 'jukebox', 'jumbo', 'kayak', 'kazoo', 'keyhole',
	'khaki', 'kilobyte', 'kiosk', 'kitsch', 'kiwifruit', 'klutz', 'knapsack', 'larynx', 'lengths', 'lucky', 'luxury', 'lymph', 'marquis', 'matrix', 'megahertz',
	'microwave', 'mnemonic', 'mystify', 'naphtha', 'nightclub', 'nowadays', 'numbskull', 'nymph', 'onyx', 'ovary', 'oxidize', 'oxygen', 'pajama', 'peekaboo', 'phlegm',
	'pixel', 'pizazz', 'pneumonia', 'polka', 'pshaw', 'psyche', 'puppy', 'puzzling', 'quartz', 'queue', 'quips', 'quixotic', 'quiz', 'quizzes', 'quorum', 'razzmatazz',
	'rhubarb', 'rhythm', 'rickshaw', 'schnapps', 'scratch', 'shiv', 'snazzy', 'sphinx', 'spritz', 'squawk', 'staff', 'strength', 'strengths', 'stretch', 'stronghold',
	'stymied', 'subway', 'swivel', 'syndrome', 'thriftless', 'thumbscrew', 'topaz', 'transcript', 'transgress', 'transplant', 'triphthong', 'twelfth', 'twelfths',
	'unknown', 'unworthy', 'unzip', 'uptown', 'vaporize', 'vixen', 'vodka', 'voodoo', 'vortex', 'voyeurism', 'walkway', 'waltz', 'wave', 'wavy', 'waxy', 'wellspring',
	'wheezy', 'whiskey', 'whizzing', 'whomever', 'wimpy', 'witchcraft', 'wizard', 'woozy', 'wristwatch', 'wyvern', 'xylophone', 'yachtsman', 'yippee', 'yoked', 'youthful',
	'yummy', 'zephyr', 'zigzag', 'zigzagging', 'zilch', 'zipper', 'zodiac', 'zombie'
];

module.exports = config;

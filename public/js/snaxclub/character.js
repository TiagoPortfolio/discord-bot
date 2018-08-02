window.onload = function () {
	// Original character stats
	const CHARACTER = getStats();
	const STATS_POINTS = getStatsPoints();

	function getStats() {
		return {
			hp 		: document.getElementById("hp"),
			attack	: document.getElementById("attack"),
			defense : document.getElementById("defense"),
			dodge   : document.getElementById("dodge")
		};
	}

	function getStatsPoints() {
		return document.getElementById("statsPoints").innerText;
	}

	function verifyStatsPoints() {
		if (getStatsPoints() == 0) {
			let finalStats = getStats();
			let statsPointsSpent =
				((finalStats.hp - CHARACTER.hp) / 2) +
				(finalStats.attack - CHARACTER.attack) +
				(finalStats.defense - CHARACTER.defense) +
				(finalStats.dodge - CHARACTER.dodge) +
			;

			if (statsPointsSpent > STATS_POINTS) {
				return "error";
			} else {
				// Update database through AJAX request to node
			}
		}
	}

	document.getElementsByClassName("addStat").onclick = function() {
		if (getStatsPoints() > 0) {
			let statPoint = this.previousSibling;
			statPoint.value += 1;
			statPoint.parentNode.previousSibling.innerText += 1;
		} else {
			// Return error
		}
	};
};
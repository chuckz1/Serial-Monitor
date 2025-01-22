// Function to parse URL parameters and apply settings
function loadSettingsFromURL() {
	const params = new URLSearchParams(window.location.search);

	// Set Baud Rate
	if (params.has("baud")) {
		const baud = params.get("baud");

		if (!isNaN(baud)) {
			// Check if the baud rate is in the dropdown options
			if (document.querySelector(`#baudSelect option[value="${baud}"]`)) {
				document.getElementById("baudSelect").value = baud;
				setBaudRateDropdown();
			} else {
				// If custom, set it in the baud rate field
				document.getElementById("baudRateField").value = baud;
				setCustomBaudRate();
			}
		} else {
			// Set default baud rate and update the URL
			setBaudRateDropdown();
		}
	} else {
		// Set default baud rate without updating the URL
		setBaudRateDropdown(false);
	}

	// Set AutoScroll
	if (params.has("autoscroll")) {
		const scroll = params.get("autoscroll") !== "false";
		document.getElementById("scroll").checked = scroll;
		setAutoScroll();
	}

	// Set Time Stamp
	if (params.has("timestamp")) {
		const timestamp = params.get("timestamp") === "true";
		document.getElementById("time").checked = timestamp;
		setTimeStamp();
	}

	// Set Line Ending
	if (params.has("lineending")) {
		let ending = params.get("lineending");
		if (!isNaN(ending)) {
			// Clamp the value to a valid range
			ending = Math.max(
				0,
				Math.min(
					ending,
					document.getElementById("sendEnding").options.length - 1
				)
			);

			// Set the value in the dropdown
			document.getElementById("sendEnding").value = ending;
			setEndingType();
		} else {
			// Set default ending and update the URL
			setEndingType();
		}
	}
}

// Function to update a single URL parameter
function updateURLParameter(key, value) {
	const params = new URLSearchParams(window.location.search);

	// Update or set the parameter
	params.set(key, value);

	// Construct the new URL
	const newUrl = `${window.location.pathname}?${params.toString()}`;

	// Use the History API to update the URL without reloading the page
	window.history.replaceState({}, "", newUrl);
}

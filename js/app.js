var map;
var markers = [];

function initMap() {
	map = new google.maps.Map(document.getElementById("googleMap"), {
		center: {lat: 39.1, lng: -84.5},
		zoom: 12,
		mapTypeId: google.maps.MapTypeId.ROADS,
		mapTypeControl: false
	});

	var locations = [
		{title: 'Random Place 1', location: {lat: 39.05, lng:-84.529}},
		{title: 'Toyota', location: {lat:39.0469144, lng:-84.6246263}},
		{title: 'Nielsen', location: {lat: 39.1021684, lng: -84.5107109}},
		{title: 'Centric', location: {lat: 39.2263451, lng: -84.3569102}},
		// {title: 'Random Place 2', location: {lat: 39.1042068, lng: -84.5816587}},
	];

	var largeInfoWindow = new google.maps.InfoWindow();
	
	for (var i = 0; i < locations.length; i++) {
		var thisTitle = locations[i].title;
		var thisPosition = locations[i].location;
		var thisMarker = new google.maps.Marker({
			position: thisPosition,
			title: thisTitle,
			animation: google.maps.Animation.DROP,
			id: i
		});
		//Add each new marker to the markers array
		markers.push(thisMarker);
		//Attach infoWindow to each marker
		thisMarker.addListener('click', function() {
			populateInfoWindow(this, largeInfoWindow);
		});	
	}	

	document.getElementById("show-listings").addEventListener('click', showListings);
	document.getElementById("hide-listings").addEventListener('click', hideListings);
	document.getElementById("zoom-go").addEventListener('click', searchWithinTime);
	document.getElementById("selected-time").innerHTML=document.getElementById("commute-time").value+" minutes";
	document.getElementById("commute-time").addEventListener('change', showVal);

	function populateInfoWindow(marker, infowindow) {
		infowindow.marker = marker;
		infowindow.setContent('<div><center>' + marker.title + '<p>' + marker.position + '</div>');
		infowindow.open(map, marker);
		infowindow.addListener('closeclick', function() {
			// infowindow.setMap(null);
		});
	}

	function showListings() {
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < markers.length; i++) {
			//Put each marker on the map
			markers[i].setMap(map);
			//Extend the map bounds so that each marker is in view
			bounds.extend(markers[i].position);
		}
		//Tell map to fit boudnaries of markers
		map.fitBounds(bounds);
	}

	function hideListings() {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
	}

	function zoomToArea() {
		console.log("in zoomToArea function");
		var geocoder = new google.maps.Geocoder();
		//Get the address entered by user
		var destinationAddress = document.getElementById("destination").value;
		//Make sure address isn't blank
		if (destinationAddress == '') {
			window.alert('You must enter a city or address.');
		}
		else {
			geocoder.geocode({
				address: destinationAddress,
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var newLocation = results[0].geometry.location;
					//Move the map to show the Destination
					map.setCenter(newLocation);
					map.setZoom(12);
					//Show the formatted address in the side bar
					// document.getElementById("geocodeOutput").innerHTML=results[0].formatted_address;
					//Add a marker for the Destination
					var thisMarker = new google.maps.Marker({
						position: newLocation,
						title: "Destination",
						animation: google.maps.Animation.DROP,
					});
					//Add new marker to the marker array so it shows up when I click "Show Listings" button
					markers.push(thisMarker);
					showListings();
				}
				else {
					document.getElementById("geocodeOutput").innerHTML="Sorry, we could not find that location.";
				}
			});
		}
	}

	function searchWithinTime() {
		zoomToArea();
		console.log("in searchWithinTime function");
		var distanceMatrixService = new google.maps.DistanceMatrixService;
		//Get destination from user input
		var destinationAddress = document.getElementById("destination").value;
		
		hideListings();

		//Create an array "origins" containing the LatLng ("position") data from the markers array
		var origins = [];
		for (var i = 0; i < markers.length; i++) {
			origins[i] = markers[i].position;
			console.log(origins[i]);
		}

		//Get transportation mode from user input
		var mode = document.querySelector('input[name="mode"]:checked').value;

		//Send the origins, destination, travel mode, etc. and execute displayMarkersWithinTime() if status === OK
		distanceMatrixService.getDistanceMatrix({
			origins: origins,
			destinations: [destinationAddress],
			travelMode: google.maps.TravelMode[mode],
			unitSystem: google.maps.UnitSystem.initMapERIAL,
		}, function(response, status) {
			if (status !== "OK") {
				window.alert("Error: " + status);
			}
			else {
				displayMarkersWithinTime(response);
			}
		});
		
	}

	function displayMarkersWithinTime(response) {
		console.log("in displayMarkersWithinTime function");
		//Get user input for max travel time
		var maxTravelTime = document.getElementById("commute-time").value;
		//Get array of origin addresses
		var origins = response.originAddresses;
		//Get array of destination addresses
		var destinations = response.destinationAddresses;
		//Parse through results to get distance and duration of each origin-destination pair
		//Track whether at least one result is found
		var atLeastOne = false;
		for (var i = 0; i < origins.length; i++) {
			//Tracks one element dataset per origin + destination pair
			var results = response.rows[i].elements;
			for (var j = 0; j < results.length; j++) {
				var element = results[j];
				if (element.status === "OK") {
					//Distance returned in feet, but text is in miles
					var distanceText = element.distance.text;
					//Duration value is returned in seconds, but we adjust it to minutes
					var durationValue = element.duration.value / 60;
					var durationText = element.duration.text;
					if (durationValue <= maxTravelTime) {
						//origins[i] = markers[i] -- Set the marker on the map if it's within the max travel time
						markers[i].setMap(map);
						atLeastOne = true;
						//Create an info window with travel time and distance
						var infoWindow = new google.maps.InfoWindow({
							content: durationText + " away, " + distanceText,
						});
						//Immediately opens the info window for each marker within the max travel time
						infoWindow.open(map, markers[i]);
						//When user closes the small window (with travel time, distance)
						//The next time they click on the marker it opens the big info window (from populateInfoWindow())
						markers[i].infoWindow = infoWindow;
						google.maps.event.addListener(markers[i], 'click', function() {
							this.infoWindow.close();
						});
					}
				}
			}
		}

	}

	function showVal() {
		console.log("it's doing something");
		var selectedTime = document.getElementById("commute-time").value+" minutes";
		document.getElementById("selected-time").innerHTML=selectedTime;
	}
	
}
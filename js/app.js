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
		{title: 'Place 1', location: {lat: 39.1, lng:-84.5}},
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
		if (infowindow.marker != marker) {
			infowindow.marker = marker;
			infowindow.setContent('<div><center>' + marker.title + '<p>' + marker.position + '</div>');
			infowindow.open(map, marker);
			infowindow.addListener('closeclick', function() {
				infowindow.setMarker(null);
			});
		}
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
		//map.fitBounds(bounds);
	}

	function hideListings() {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
	}

	function zoomToArea() {
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
		console.log("search within time");
		var distanceMatrixService = new google.maps.DistanceMatrixService;
		var destinationAddress = document.getElementById("destination").value;
		if (destinationAddress == '') {
			// window.alert('You must enter a city or address.');
		}
		else {
			hideListings();
			var origins = [];
			for (var i = 0; i < markers.length; i++) {
				origins[i] = markers[i].position;
			}

			var mode = document.querySelector('input[name="mode"]:checked').value;

			distanceMatrixService.getDistanceMatrix({
				origins: origins,
				destinations: [destinationAddress],
				travelMode: google.maps.TravelMode[mode],
				unitSystem: google.maps.UnitSystem.initMapERIAL,
			}, function(response, status) {
				if (status !== google.maps.DistanceMatrixService.OK) {
					window.alert("Error: " + status);
				}
				else {
					displayMarkersWithinTime(response);
				}
			});
		}
	}

	function displayMarkersWithinTime(response) {
		console.log("in displayMarkersWithinTime function");
		var maxTravelTime = document.getElementById("commute-time").value;
		var origins = response.originAddresses;
		var destinations = response.destinationAddresses;
		//Parse through results to get distance and duration of each
		//Use nested loop because there might be multiple origins and destinations
		//Make sure at least one result is found
		var atLeastOne = false;
		for (var i = 0; i < origins.length; i++) {
			//Creates one element per origin + destination pair
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
						markers[i].setMap(map);
						atLeastOne = true;
						var infoWindow = new google.maps.InfoWindow({
							content: durationText + " away, " + distanceText,
						});
						infoWindow.open(map, markers[i]);
						//Put this in a small window, when user clicks it opens the big window
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
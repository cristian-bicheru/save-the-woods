// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var id;

$(function(){
  // This is the host for the backend.
  // TODO: When running Firenotes locally, set to http://localhost:8081. Before
  // deploying the application to a live production environment, change to
  // https://backend-dot-<PROJECT_ID>.appspot.com as specified in the
  // backend's app.yaml file.
  var backendHostUrl = '--backend-url--';

  // [START gae_python_firenotes_config]
  // Obtain the following from the "Add Firebase to your web app" dialogue
  // Initialize Firebase
  var config = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: ""
  };
  // [END gae_python_firenotes_config]

  // This is passed into the backend to authenticate the user.
  var userIdToken = null;

  // Firebase log-in
  function configureFirebaseLogin() {

    firebase.initializeApp(config);

    // [START gae_python_state_change]
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $('#logged-out').hide();
        var name = user.displayName;

        /* If the provider gives a display name, use the name for the
        personal welcome message. Otherwise, use the user's email. */
        var welcomeName = name ? name : user.email;

        user.getToken().then(function(idToken) {
          userIdToken = idToken;
	  id = idToken;

          /* Now that the user is authenicated, fetch the notes. */
          fetchNotes();

	  $('#user').append($('<h4 style="letter-spacing:1px;margin:0;">').text(user.email));
          $('#logged-in').show();

        });

      } else {
        $('#logged-in').hide();
        $('#logged-out').show();

      }
    // [END gae_python_state_change]

    });

  }

  // [START configureFirebaseLoginWidget]
  // Firebase log-in widget
  function configureFirebaseLoginWidget() {
    var uiConfig = {
      'signInSuccessUrl': '/settings',
      'signInOptions': [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      // Terms of service url
      'tosUrl': '<your-tos-url>',
    };

    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', uiConfig);
  }
  // [END gae_python_firebase_login]

  // [START gae_python_fetch_notes]
  // Fetch notes from the backend.
  function fetchNotes() {
    $.ajax(backendHostUrl + '/accountdata', {
      /* Set header for the XMLHttpRequest to get data from the web server
      associated with userIdToken */
      headers: {
        'Authorization': 'Bearer ' + userIdToken
      }
    }).then(function(data){
      $('#locationb').empty();
      $('#points').empty();
      // Iterate over user data to display user's notes from database.
      data.forEach(function(note){
        $('#locationb').append($('<h4 style="letter-spacing:1px;margin:0;">').text(note.location));
        $('#points').append($('<h4 style="letter-spacing:1px;margin:0;">').text(note.points));
      });
    });
  }
  // [END gae_python_fetch_notes]

  // Sign out a user
  var signOutBtn =$('#sign-out');
  signOutBtn.click(function(event) {
    event.preventDefault();

    firebase.auth().signOut().then(function() {
      console.log("Sign out successful");
    }, function(error) {
      console.log(error);
    });
  });

  // Save a note to the backend
  var saveNoteBtn = $('#add-note');
  saveNoteBtn.click(function(event) {
    event.preventDefault();

    var noteField = $('#pac-input');
    var note = noteField.val();
    noteField.val("");

    /* Send note data to backend, storing in database with existing data
    associated with userIdToken */
    $.ajax(backendHostUrl + '/accountdata', {
      headers: {
        'Authorization': 'Bearer ' + userIdToken
      },
      method: 'POST',
      data: JSON.stringify({'location': note}),
      contentType : 'application/json'
    }).then(function(){
      // Refresh notebook display.
      fetchNotes();
    });

  });

  configureFirebaseLogin();
  configureFirebaseLoginWidget();

});


function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -33.8688, lng: 151.2195},
    zoom: 13
  });
  var card = document.getElementById('pac-card');
  var input = document.getElementById('pac-input');
  var types = document.getElementById('type-selector');
  var strictBounds = document.getElementById('strict-bounds-selector');
  var backendHostUrl = '--backend-url--';
  function fetchNotes() {
    $.ajax(backendHostUrl + '/accountdata', {
      /* Set header for the XMLHttpRequest to get data from the web server
      associated with userIdToken */
      headers: {
        'Authorization': 'Bearer ' + id
      }
    }).then(function(data){
      $('#locationb').empty();
      $('#points').empty();
      $('#pac-input').empty();
      // Iterate over user data to display user's notes from database.
      data.forEach(function(note){
        $('#locationb').append($('<h4 style="letter-spacing:1px;margin:0;">').text(note.location));
        $('#points').append($('<h4 style="letter-spacing:1px;margin:0;">').text(note.points));
      });
    });
  }
  

  var autocomplete = new google.maps.places.Autocomplete(input);

  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the
  // bounds option in the request.
  autocomplete.bindTo('bounds', map);

  // Set the data fields to return when the user selects a place.
  autocomplete.setFields(
      ['address_components', 'geometry', 'icon', 'name']);

  var infowindow = new google.maps.InfoWindow();
  var infowindowContent = document.getElementById('infowindow-content');
  infowindow.setContent(infowindowContent);
  var marker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29)
  });

  autocomplete.addListener('place_changed', function() {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("Please select your location from the dropdown.");
      return;
    }

    var note = place.name;
    /* Send note data to backend, storing in database with existing data
    associated with userIdToken */
    $.ajax(backendHostUrl + '/accountdata', {
      headers: {
        'Authorization': 'Bearer ' + id
      },
      method: 'POST',
      data: JSON.stringify({'location': note}),
      contentType : 'application/json'
    }).then(function(){
      // Refresh notebook display.
      fetchNotes();
    });
    $('#pac-input').empty();

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

    infowindowContent.children['place-icon'].src = place.icon;
    infowindowContent.children['place-name'].textContent = place.name;
    infowindowContent.children['place-address'].textContent = address;
  });

  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
}

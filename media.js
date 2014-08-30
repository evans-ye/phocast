<!--
// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
-->

/**
 * global variables
 */
var currentMediaSession = null;
var currentVolume = 0.5;
var progressFlag = 1;
var mediaCurrentTime = 0;
var session = null;
var autoJoinPolicy = 'tab_and_origin_scoped';

/**
 * Call initialization
 */
if (!chrome.cast || !chrome.cast.isAvailable) {
  setTimeout(initializeCastApi, 1000);
}


/**
 * parse query string
 */
function getQueryParams() {
    var qs = window.location.search.substring(1);
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

/**
 * initialization
 */
function initializeCastApi() {
  var p = getQueryParams();
 
  if( p['auto'] == 'page_scoped' ) {
    autoJoinPolicy = chrome.cast.AutoJoinPolicy.PAGE_SCOPED;
  }
  else if( p['auto'] == 'origin_scoped' ) {
    autoJoinPolicy = chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED;
  }
  else {
    autoJoinPolicy = chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;
  }

  var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
    sessionListener,
    receiverListener,
    autoJoinPolicy);

  chrome.cast.initialize(apiConfig, onInitSuccess, onError);
};

/**
 * initialization success callback
 */
function onInitSuccess() {
  appendMessage("init success");
}

/**
 * initialization error callback
 */
function onError() {
  console.log("error");
  appendMessage("error");
}

/**
 * generic success callback
 */
function onSuccess(message) {
  console.log(message);
}

/**
 * callback on success for stopping app
 */
function onStopAppSuccess() {
  console.log('Session stopped');
  appendMessage('Session stopped');
  document.getElementById("casticon").src = 'images/cast_icon_idle.png'; 
}

/**
 * session listener during initialization
 */
function sessionListener(e) {
  console.log('New session ID: ' + e.sessionId);
  appendMessage('New session ID:' + e.sessionId);
  session = e;
  if (session.media.length != 0) {
    appendMessage(
        'Found ' + session.media.length + ' existing media sessions.');
    onMediaDiscovered('onRequestSessionSuccess_', session.media[0]);
  }
  session.addMediaListener(
      onMediaDiscovered.bind(this, 'addMediaListener'));
  session.addUpdateListener(sessionUpdateListener.bind(this));  
}

/**
 * session update listener 
 */
function sessionUpdateListener(isAlive) {
  var message = isAlive ? 'Session Updated' : 'Session Removed';
  message += ': ' + session.sessionId;
  appendMessage(message);
  if (!isAlive) {
    session = null;
  }
};

/**
 * receiver listener during initialization
 */
function receiverListener(e) {
  if( e === 'available' ) {
    console.log("receiver found");
    appendMessage("receiver found");
	launchApp();
  }
  else {
    console.log("receiver list empty");
    appendMessage("receiver list empty");
  }
}

/**
 * launch app and request session
 */
function launchApp() {
  console.log("launching app...");
  appendMessage("launching app...");
  chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
}

/**
 * callback on success for requestSession call  
 * @param {Object} e A non-null new session.
 */
function onRequestSessionSuccess(e) {
  console.log("session success: " + e.sessionId);
  appendMessage("session success: " + e.sessionId);
  session = e;
  document.getElementById("casticon").src = 'images/cast_icon_active.png'; 
}

/**
 * callback on launch error
 */
function onLaunchError() {
  console.log("launch error");
  appendMessage("launch error");
}

/**
 * stop app/session
 */
function stopApp() {
  session.stop(onStopAppSuccess, onError);
  clearInterval(interval_id);
}

/**
 * load media
 * @param {string} i An index for media
 */
function loadMedia(url) {
  if (!session) {
    console.log("no session");
    appendMessage("no session");
    return;
  }

  console.log("loading..." + url);
  appendMessage("loading..." + url);
  
  var mediaInfo = new chrome.cast.media.MediaInfo(url, 'video/mp4');

  mediaInfo.metadata = new chrome.cast.media.PhotoMediaMetadata();
  mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.PHOTO;
  mediaInfo.metadata.artist = 'Photo artist';
  mediaInfo.metadata.location = 'San Francisco';
  mediaInfo.metadata.longitude = 37.7833;
  mediaInfo.metadata.latitude = 122.4167;
  mediaInfo.metadata.width = 1728;
  mediaInfo.metadata.height = 1152;
  mediaInfo.metadata.creationDateTime = '1999';
  mediaInfo.contentType = 'image/jpg';

  //mediaInfo.metadata.title = media[currentMediaIndex]['title'];
  mediaInfo.metadata.images = [{'url': url}];

  var request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.autoplay = true;
  request.currentTime = 0;
  session.loadMedia(request,onMediaDiscovered.bind(this, 'loadMedia'), onMediaError.bind(this));

}

/**
 * callback on success for loading media
 * @param {Object} e A non-null media object
 */
function onMediaDiscovered(how, mediaSession) {
  console.log("new media session ID:" + mediaSession.mediaSessionId);
  appendMessage("new media session ID:" + mediaSession.mediaSessionId + ' (' + how + ')');
  currentMediaSession = mediaSession;
  mediaSession.addUpdateListener(onMediaStatusUpdate);
  mediaCurrentTime = currentMediaSession.currentTime;
  document.getElementById("casticon").src = 'images/cast_icon_active.png'; 
}

/**
 * callback on media loading error
 * @param {Object} e A non-null media object
 */
function onMediaError(e) {
  console.log("media error");
  appendMessage("media error");
  document.getElementById("casticon").src = 'images/cast_icon_warning.png'; 
}

/**
 * callback for media status event
 * @param {Object} e A non-null media object
 */
function onMediaStatusUpdate(isAlive) {
  //if( progressFlag ) {
  //  document.getElementById("progress").value = parseInt(100 * currentMediaSession.currentTime / currentMediaSession.media.duration);
  //}
  //document.getElementById("playerstate").innerHTML = currentMediaSession.playerState;
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function onSeekSuccess(info) {
  console.log(info);
  appendMessage(info);
  setTimeout(function(){progressFlag = 1},1500);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function mediaCommandSuccessCallback(info) {
  console.log(info);
  appendMessage(info);
}

/**
 * reload page with auto join or not
 */
function autoJoin(value) {
  window.location.href = window.location.pathname + '?auto=' + value;
};


/**
 * append message to debug message window
 * @param {string} message A message string
 */
function appendMessage(message) {
  var dw = document.getElementById("debugmessage");
  dw.innerHTML += '\n' + JSON.stringify(message);
};



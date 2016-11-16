var express = require('express');
var router = express.Router();
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var fs = require('fs');

var serviceAccount = require("../keys/alrmup-d5e0526322d2.json");

var firebase = require('firebase-admin');
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://alrmup-ae85a.firebaseio.com/",
    databaseAuthVariableOverride: {
      uid: "my-service-worker"
    }
});

var db = firebase.database();
var usersRef = db.ref("users");

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

function authorize(credentials, code, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  if (!code) {
    getAuthUrl(oauth2Client, callback);
  } else {
    getToken(oauth2Client, code, callback);
  }
}

function getAuthUrl(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  callback(authUrl);
}

function getToken(oauth2Client, code, callback) {
  oauth2Client.getToken(code, (err, token) => {
      console.log(err);
      callback(err, token);
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getUrl', function(req, res) {
  // Load client secrets from a local file.
  fs.readFile('keys/client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      res.send('Error loading client secret file: ' + err);
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), null, (url) => {
      res.json({url: url});
    });
  });
});

router.post('/getToken', function(req, res) {
  let code = req.body.code;
  fs.readFile('keys/client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      res.send('Error loading client secret file: ' + err);
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), code, (err, token) => {
      if (err) {
        res.send(err);
      }
      res.json(token);
    });
  });
});

module.exports = router;

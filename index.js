// Dependencies
var Youtube = require('youtube-api'),
  Http = require('http'),
  Statique = require('statique'),
  Http = require('http'),
  Request = require('request'),
  credentials = require('./credentials'),
  path = require('path');

// Set ACCESS_TOKEN global as undefined
global.ACCESS_TOKEN = undefined;

// Credentials
credentials.scope = 'https://www.googleapis.com/auth/youtube';
credentials.response_type = 'code';
credentials.access_type = 'offline';

// statique config
Statique
  .server({
    root: __dirname + '/public'
  })
  .setRoutes({
    '/': function rootPage(req, res) {
      var authType = credentials.auth_uri ? 'oauth' : 'jwt';

      // Handle JWT authentication
      if (authType === 'jwt' && !ACCESS_TOKEN) {
        ACCESS_TOKEN = true;

        return Youtube.authenticate({
          type: 'jwt',
          email: credentials.email,
          keyFile: path.normalize(credentials.keyFile),
          key: credentials.key,
          subject: credentials.subject,
          scopes: [credentials.scope]
        }).authorize(function(err, data) {
          if (err) {
            return Statique.error(req, res, 500, err.toString());
          }

          rootPage(req, res);
        });
      }

      if (ACCESS_TOKEN) {
        return Statique.readFile('/html/index.html', function(err, content) {
          Statique.sendRes(res, 400, 'text/html', content);
        });
      }

      var authUrl = 'https://accounts.google.com/o/oauth2/auth?';

      for (var key in credentials) {
        // console.log(key, credentials[key]);

        if (key === 'client_secret') {
          continue;
        }

        authUrl += '&' + key + '=' + credentials[key];
      }

      res.writeHead(302, {
        'Location': authUrl
      });

      return res.end();
    },

    '/api/upload_video': function(req, res, form) {
      console.log('ACCESS_TOKEN: ', ACCESS_TOKEN);

      var metadata = {};

      form.on("done", function (form) {
        // console.log(JSON.parse(form.data));
        metadata = JSON.parse(form.data);
        // console.log(metadata);

        console.log('UPLOADING VIDEO...');


        var ResumableUpload = require('node-youtube-resumable-upload');
        var resumableUpload = new ResumableUpload(); //create new ResumableUpload
        resumableUpload.tokens = { access_token: ACCESS_TOKEN };
        resumableUpload.filepath = './test-vid.mp4';

        resumableUpload.metadata = metadata;

        resumableUpload.monitor = true;
        resumableUpload.retry = -1; //infinite retries, change to desired amount
        resumableUpload.eventEmitter.on('progress', function(progress) {
          console.log('Progress: ', progress);
        });
        resumableUpload.initUpload(function(result) {
          console.log('Result: ', result);

          return res.end(result);
        }, function(error) {
          console.log('Upload failed: ');
          console.log(JSON.stringify(error));
        });
      });


    },

    '/oauth2callback': function(req, res) {
      var url = req.url;

      if (url.indexOf("error") !== -1) {
        return res.end("Error.");
      }

      if (url.indexOf("?code=") === -1) {
        return res.end("Invalid request.");
      }

      var code = url;
      code = code.substring(code.indexOf("?code=") + 6);

      if (!code) {
        return res.end("Code is missing.");
      }

      var formData = "code=" + code +
        "&client_id=" + credentials.client_id +
        "&client_secret=" + credentials.client_secret +
        "&redirect_uri=" + credentials.redirect_uri +
        "&grant_type=authorization_code";

      var options = {
        url: "https://accounts.google.com/o/oauth2/token",
        headers: {
          "content-type": "application/x-www-form-urlencoded"
        },
        method: "POST",
        body: formData
      };

      Request(options, function(err, response, body) {
        if (err) {
          return res.end(err);
        }

        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.end(e.message + " :: " + body);
        }
        if (body.error) {
          return res.end(err || body.error);
        }

        // success
        if (body.access_token) {
          ACCESS_TOKEN = body.access_token;
          Youtube.authenticate({
            type: "oauth",
            token: ACCESS_TOKEN
          });

          res.writeHead(302, {
            "Location": "/"
          });
          res.end();
        }

        return res.end("Something wrong: \n" + JSON.stringify(body, null, 4));
      });
    }
  });


// Create server
Http.createServer(Statique.serve).listen(5000);
console.log('Open: http://localhost:5000');

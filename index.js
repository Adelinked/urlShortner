require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
const dns = require('dns');
const shortId = require('shortid');
// db configuration

let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true
  }

});

let DbUrl = mongoose.model('UrlModel', urlSchema);


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/api/shorturl', bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  if (req.body.url.length == 0) {
    res.json({ error: 'Invalid url' });
  }

  else {


    const url = new URL(req.body.url);
    const shortCode = shortId.generate();
    const options = {
      all: true,
    };
    dns.lookup(url.hostname, options, function(err, addresses) {

      if (err)
        res.json({ error: 'Invalid url' });
      else {
        DbUrl.findOne({ original_url: url })
          .then((data) => {
            console.log(data);
            if (data == null) {
              DbUrl.create({ original_url: url, short_url: shortCode })
                .then((data) => {
                  console.log(data);

                  res.json({ original_url: data.original_url, short_url: data.short_url });
                })
                .catch((err) => {
                  console.log(err);
                  res.status(500).json('Server error');
                });
            }
            else {
              res.json({ original_url: data.original_url, short_url: data.short_url });

            }
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json('Server error');
          });
      }

    })
  }

})

app.get('/api/shorturl/:short_url', function(req, res) {
  console.log(req.params.short_url)
  DbUrl.findOne({ short_url: req.params.short_url })
    .then((data) => {
      console.log(data);
      if (data != null) {
        res.redirect(data.original_url);
      }
      else {
        res.status(404).json('No Url found');
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json('Server error');
    });
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


exports.urlModel = DbUrl;

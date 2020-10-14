'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var bodyParser = require('body-parser');
var shortId = require('shortid');
var validUrl = require('valid-url');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log('Database is connected'))
.catch((error) => console.log("Error occured", error));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});

const URL = mongoose.model('URL', urlSchema);

app.post('/api/shorturl/new', async(req, res) => {
  const url = req.body.url;
  const shortUrl = shortId.generate();
  if(!validUrl.isUri(url)) {
    return res.json({error: 'invalid URL'})
  } else {
    try {
      let result = await URL.findOne({original_url: url});
      if(!result) {
        result = new URL({
          original_url: url,
          short_url: shortUrl
        });
        await result.save();
      }
      res.json({
          original_url: result.original_url,
          short_url: result.short_url
        })
    } catch(err) {
      res.json({error: 'Server Error'});
    }
  }
});

app.get('/api/shorturl/:short_url?', async (req, res) => {
  try {
    const redirectUrl = await URL.findOne({short_url: req.params.short_url});
    if(redirectUrl) {
      return res.redirect(redirectUrl.original_url)
    } else {
      return res.json('No URL Found')
    }
  } catch (err) {
    res.json({error: 'Server Error'});
  }
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});
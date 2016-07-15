const dom = require('node-dom').dom;
const express = require('express');
const request = require('request');

const app = express();
const cache = {};

cache.beers = {
  url: 'https://untappd.com/user/wblanchette',
  expression: `document.querySelector('.stats [data-href=":stats/beerhistory"]').innerText.replace(/[^0-9]/g, '');`
};

app.get('/:token', (req, res) => {
  const job = cache[req.params.token];

  if (job) {
    if (!job.data) {
      request(job.url, (error, response, html) => {
        if (!error && response.statusCode == 200) {
          const window = dom(html, null, {url: job.url});
          const document = window.document;
          job.data = eval(job.expression); // FIXME: Run in a sandbox
          res.send(job.data);
        }
      });
    } else {
      res.send(job.data);
    }
  } else {
    res.status(404);
  }
});

app.listen(process.env.PORT || 3000, () => {});

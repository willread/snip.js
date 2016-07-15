const config = {
  rateLimit: 60 * 60 * 1000 // Only run once per hour, max
};

const jsdom = require('jsdom');
const express = require('express');
const vm = require('vm');

const app = express();
const cache = {};

// Fetch my beer count from untappd

cache.beers = {
  url: 'http://untappd.com/user/wblanchette',
  expression: `document.querySelector('.stats [data-href=":stats/beerhistory"]').innerHTML.replace(/[^0-9]/g, '');`
};

// Fetch my game count from steam

cache.games = {
  url: 'http://steamcommunity.com/profiles/76561197976583032',
  expression: `document.querySelectorAll('.profile_count_link_total')[1].innerHTML.replace(/[^0-9]/g, '')`
};

// Fetch my song count from soundcloud

cache.songs = {
    url: 'http://soundcloud.com/will-blanchette',
    expression: `document.querySelector('[property="soundcloud:sound_count"]').content`
};

app.get('/:token', (req, res) => {
  const job = cache[req.params.token];

  if (job) {
    const now = (new Date()).getTime();
    if (!job.data || (job.timestamp && now - job.timestamp >= config.rateLimit)) {
      jsdom.env({
        url: job.url,
        features: {},
        done: (err, window) => {
          try {
            const script = new vm.Script(job.expression, {});
            job.data = jsdom.evalVMScript(window, script);
            job.timestamp = now;
            res.jsonp(job.data);
          } catch(e) {
            res.status(500).jsonp(null);
          }
        }
      });
    } else {
      res.jsonp(job.data);
    }
  } else {
    res.status(404).jsonp(null);
  }
});

app.listen(process.env.PORT || 3000, () => {});

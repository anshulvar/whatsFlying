const https = require('https');

const CLIENT_ID = process.env.OPENSKY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET || '';
const AUTH_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

let cachedToken = null;
let tokenExpiresAt = 0;
let tokenPromise = null;
let tokenReady = false;
const REFRESH_MARGIN = 30;

function fetchToken() {
  return new Promise((resolve) => {
    const body = 'grant_type=client_credentials&client_id=' + encodeURIComponent(CLIENT_ID)
      + '&client_secret=' + encodeURIComponent(CLIENT_SECRET);

    const req = https.request(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('  OpenSky token fetch FAILED: HTTP ' + res.statusCode + ' ' + data.slice(0, 200));
          return resolve(null);
        }
        try {
          const json = JSON.parse(data);
          cachedToken = json.access_token;
          const expiresIn = json.expires_in || 1800;
          tokenExpiresAt = Date.now() + (expiresIn - REFRESH_MARGIN) * 1000;
          resolve(cachedToken);
        } catch (e) {
          console.error('  OpenSky token parse failed:', e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (err) => {
      console.error('  OpenSky token request error:', err.message);
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

function ensureToken() {
  if (tokenReady && cachedToken && Date.now() < tokenExpiresAt) {
    return Promise.resolve(cachedToken);
  }
  if (!tokenPromise) {
    tokenPromise = fetchToken().then(token => {
      tokenPromise = null;
      tokenReady = !!token;
      return token;
    });
  }
  return tokenPromise;
}

if (CLIENT_ID && CLIENT_SECRET) {
  console.log('OpenSky: credentials found, requesting token...');
  ensureToken().then(token => {
    if (token) {
      console.log('OpenSky: token acquired successfully');
    } else {
      console.warn('  OpenSky: token fetch failed — API calls will be anonymous (rate limited)');
    }
  });
  setInterval(() => ensureToken(), 25 * 60 * 1000);
} else {
  console.warn('OpenSky: OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET not set — anonymous (400 req/day)');
  console.warn('  Create API client at https://opensky-network.org/my-opensky/account');
}

const PROXY_CONFIG = {
  '/api/states/all': {
    target: 'https://opensky-network.org',
    secure: true,
    changeOrigin: true,
    onProxyReq: function(proxyReq) {
      if (cachedToken) {
        proxyReq.setHeader('Authorization', 'Bearer ' + cachedToken);
      }
    }
  }
};

module.exports = PROXY_CONFIG;

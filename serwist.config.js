const { serwist } = require('@serwist/next/config');

module.exports = serwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
});

var Papa = require('papaparse'), path = require('path')

if (window) {
  window.__DATA__ = Papa.parse('/data/clinical_trials_cleaned.csv', {
    download: true,
    header: true,
    complete:  function(results, file) {
      window.__DATA__ = results;
    }
  });
}

'use strict';

var getCurrentItem = require('../getCurrentItem');

/**
 * Split a list item at the start of the current range.
 *
 * @param  {Object} opts
 * @param  {Slate.Change} change
 * @return {Slate.Change}
 */
function splitListItem(opts, change) {
  var value = change.value;

  var currentItem = getCurrentItem(opts, value);
  var splitOffset = value.startOffset;

  return change.splitDescendantsByKey(currentItem.key, value.startKey, splitOffset);
}

module.exports = splitListItem;
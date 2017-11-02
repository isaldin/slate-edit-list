'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Options = require('./options');
var onEnter = require('./onEnter');
var onTab = require('./onTab');
var onBackspace = require('./onBackspace');
var makeSchema = require('./makeSchema');

var wrapInList = require('./changes/wrapInList');
var unwrapList = require('./changes/unwrapList');
var splitListItem = require('./changes/splitListItem');
var increaseItemDepth = require('./changes/increaseItemDepth');
var decreaseItemDepth = require('./changes/decreaseItemDepth');

var getItemDepth = require('./getItemDepth');
var isList = require('./isList');
var isSelectionInList = require('./isSelectionInList');
var getCurrentItem = require('./getCurrentItem');
var getCurrentList = require('./getCurrentList');
var getItemsAtRange = require('./getItemsAtRange');
var getPreviousItem = require('./getPreviousItem');

var KEY_ENTER = 'Enter';
var KEY_TAB = 'Tab';
var KEY_BACKSPACE = 'Backspace';

/**
 * A Slate plugin to handle keyboard events in lists.
 * @param {Options} [opts] Options for the plugin
 * @return {Object}
 */

function EditList() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    opts = new Options(opts);

    /**
     * Bind a change to be only applied in list
     */
    function bindChange(fn) {
        return function (change) {
            var value = change.value;


            if (!isSelectionInList(opts, value)) {
                return change;
            }

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return fn.apply(undefined, _toConsumableArray([opts, change].concat(args)));
        };
    }

    /**
     * User is pressing a key in the editor
     */
    function onKeyDown(event, change, editor) {
        var args = [event, change, editor, opts];

        switch (event.key) {
            case KEY_ENTER:
                return onEnter.apply(undefined, args);
            case KEY_TAB:
                return onTab.apply(undefined, args);
            case KEY_BACKSPACE:
                return onBackspace.apply(undefined, args);
        }
    }

    var _makeSchema = makeSchema(opts),
        schema = _makeSchema.schema,
        validateNode = _makeSchema.validateNode;

    return {
        onKeyDown: onKeyDown,

        schema: schema,
        validateNode: validateNode,

        utils: {
            getCurrentItem: getCurrentItem.bind(null, opts),
            getCurrentList: getCurrentList.bind(null, opts),
            getItemDepth: getItemDepth.bind(null, opts),
            getItemsAtRange: getItemsAtRange.bind(null, opts),
            getPreviousItem: getPreviousItem.bind(null, opts),
            isList: isList.bind(null, opts),
            isSelectionInList: isSelectionInList.bind(null, opts)
        },

        changes: {
            decreaseItemDepth: bindChange(decreaseItemDepth),
            increaseItemDepth: bindChange(increaseItemDepth),
            splitListItem: bindChange(splitListItem),
            unwrapList: bindChange(unwrapList),
            wrapInList: wrapInList.bind(null, opts)
        }
    };
}

module.exports = EditList;
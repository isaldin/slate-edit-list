const isList = require('./isList');

/**
 * Create a schema for lists
 * @param {PluginOptions} The plugin options
 * @return {Object} A schema definition with rules to normalize lists
 */
function makeSchema(opts) {
    return {
        rules: [
            listsContainOnlyItems(opts),
            itemsDescendList(opts),
            // Must be after itemsDescendList
            itemsContainBlocks(opts),
            joinAdjacentLists(opts)
        ]
    };
}

/**
 * @param {PluginOptions} The plugin options
 * @return {Object} A rule that ensure lists only contain list
 * items, and at least one.
 */
function listsContainOnlyItems(opts) {
    return {
        match: (node) => isList(opts, node),

        validate(list) {
            const notItems = list.nodes.filter(n => n.type !== opts.typeItem);

            if (notItems.isEmpty()) {
                // Only valid list items
                return null;
            } else {
                // All the non items
                return {
                    toWrap: notItems
                };
            }
        },

        /**
         * @param {List<Nodes>} value.toWrap Children to wrap in list
         */
        normalize(change, node, value) {
            value.toWrap.forEach(child => change.wrapBlockByKey(child.key, opts.typeItem));
            return change;
        }
    };
}

/**
 * @param {PluginOptions} The plugin options
 * @return {Object} A rule that ensure list items are always children
 * of a list block.
 */
function itemsDescendList(opts) {
    return {
        match(node) {
            return (node.kind === 'block' || node.kind === 'document')
                && !isList(opts, node);
        },

        validate(block) {
            const listItems = block.nodes.filter(n => n.type === opts.typeItem);

            if (listItems.isEmpty()) {
                // No orphan list items. All good.
                return null;
            } else {
                // Unwrap the orphan list items
                return {
                    toUnwrap: listItems
                };
            }
        },

        /**
         * Unwrap the given blocks
         * @param {List<Nodes>} value.toUnwrap
         */
        normalize(change, node, value) {
            value.toUnwrap.forEach(child => change.unwrapBlockByKey(child.key));
            return change;
        }
    };
}

/**
 * @param {PluginOptions} The plugin options
 * @return {Object} A rule that ensure list items always contain
 * blocks.
 */
function itemsContainBlocks(opts) {
    return {
        match: (node) => node.type === opts.typeItem,

        validate(item) {
            const shouldWrap = item.nodes.some(node => node.kind !== 'block');

            return shouldWrap || null;
        },

        /**
         * Wraps the children nodes in the default block
         */
        normalize(change, node, _) {
            const noNorm = { normalize: false };

            change.wrapBlockByKey(node.nodes.first().key, opts.typeDefault, noNorm);

            const wrapper = change.state.document
                      .getDescendant(node.key)
                      .nodes.first();

            // Add the remaining items
            node.nodes.rest().forEach((child, index) => change.moveNodeByKey(
              child.key,
              wrapper.key,
              index + 1,
              noNorm
            ));

            return change;
        }
    };
}

/**
 * @param {PluginOptions} The plugin options
 * @return {Object} A rule that joins adjacent, same types lists
 */
function joinAdjacentLists(opts) {
    return {
        match: (node) => node.kind === 'document' || node.kind === 'block',

        validate(node) {
            const invalids = node.nodes
            .map((child, i) => {
                if (!isList(opts, child)) return;
                const next = node.nodes.get(i + 1);
                if (!next || next.type !== child.type) return;
                return [child, next];
            })
            .filter(Boolean);

            return invalids.size ? invalids : null;
        },

        /**
         * Join the list pairs
         */
        normalize(change, node, pairs) {
            // We join in reverse order, so that multiple lists folds onto the first one
            pairs.reverse().forEach((pair) => {
                const [ first, second ] = pair;
                const updatedSecond = change.state.document.getDescendant(second.key);
                updatedSecond.nodes.forEach((secondNode, index) => {
                    change.insertNodeByKey(first.key, first.nodes.size + index, secondNode);
                });

                change.removeNodeByKey(second.key);
            });

            return change;
        }
    };
}

module.exports = makeSchema;

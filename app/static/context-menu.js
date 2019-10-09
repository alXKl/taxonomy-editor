
var menuNode = [
	{
		title: 'Suggest new Term',
		children: [
			{
                title: 'Synonym',
                action: function() {
                    menuNodeAction("syno");
                    // console.log('You have clicked the second item!');
                    // console.log('The data for this circle is: ' + d);
                }
            },
            {
                title: 'Antonym',
                action: function() {
                    menuNodeAction("anto");
                }
            },
            {
                title: 'Hypernym',
                action: function() {
                    menuNodeAction("hyper");
                }
            },
            {
                title: 'Hyponym',
                action: function() {
                    menuNodeAction("hypo");
                }
            },
            {
                title: 'Cohyponym',
                action: function() {
                    menuNodeAction("cohypo");
                }
            },
            {
                title: 'Meronym',
                action: function() {
                    menuNodeAction("mero");
                }
            },
            {
                title: 'Holonym',
                action: function() {
                    menuNodeAction("holo");
                }
            },
            {
                title: 'Troponym',
                action: function() {
                    menuNodeAction("tropo");
                }
            }
        ]
    },
    {
        title: 'Find Nearest Neighbors',
        action: function() {
        	menuNodeAction("NN");
        }
    },
    {
        title: 'Find Analogies',
        action: function() {
        	menuNodeAnalogy();
        }
    },
    {
        title: 'Remove',
        action: function() {
        	remove();
        }
    },
    {
        divider: true
    },
    {
        title: 'Cancel',
        action: function() {

        }
    }
];

var menuLink = [
    {
        title: 'Suggest Relation',
        action: function() {
            menuLinkAction();
        }
    },
	{
		title: 'Annotate',
		children: [
			{
                title: 'Synonym',
                action: function() {
                    annotate("syno", 'train');
                },
            },
            {
                title: 'Antonym',
                action: function() {
                    annotate("anto", 'train');
                }
            },
            {
                title: 'Hypernym',
                action: function() {
                    annotate("hyper", 'train');
                }
            },
            {
                title: 'Hyponym',
                action: function() {
                    annotate("hypo", 'train');
                }
            },
            {
                title: 'Cohyponym',
                action: function() {
                    annotate("cohypo", 'train');
                }
            },
            {
                title: 'Meronym',
                action: function() {
                    annotate("mero", 'train');
                }
            },
            {
                title: 'Holonym',
                action: function() {
                    annotate("holo", 'train');
                }
            },
            {
                title: 'Troponym',
                action: function() {
                    annotate("tropo", 'train');
                }
            }
        ]
    },
    {
        title: 'Remove',
        action: function() {
        	remove();
        }
    },
    {
        divider: true
    },
    {
        title: 'Cancel',
        action: function() {

        }
    }
];

(function(root, factory) {
	if (typeof module === 'object' && module.exports) {
		var d3 = require('d3');
		module.exports = factory(d3);
	} else if(typeof define === 'function' && define.amd) {
		try {
			var d3 = require('d3');
		} catch (e) {
			d3 = root.d3;
		}

		d3.contextMenu = factory(d3);
		define([], function() {
			return d3.contextMenu;
		});
	} else if(root.d3) {
		root.d3.contextMenu = factory(root.d3);
	}
}(this,
	function (d3) {
		var utils = {
			noop: function () {},

			/**
			 * @param {*} value
			 * @returns {Boolean}
			 */
			isFn: function (value) {
				return typeof value === 'function';
			},

			/**
			 * @param {*} value
			 * @returns {Function}
			 */
			const: function (value) {
				return function () { return value; };
			},

			/**
			 * @param {Function|*} value
			 * @param {*} [fallback]
			 * @returns {Function}
			 */
			toFactory: function (value, fallback) {
				value = (value === undefined) ? fallback : value;
				return utils.isFn(value) ? value : utils.const(value);
			}
		};

		// global state for d3-context-menu
		var d3ContextMenu = null;

		var closeMenu = function () {
			// global state is populated if a menu is currently opened
			if (d3ContextMenu) {
				d3.select('.d3-context-menu').remove();
				d3.select('body').on('mousedown.d3-context-menu', null);
				d3ContextMenu.boundCloseCallback();
				d3ContextMenu = null;
			}
		};

		/**
		 * Calls API method (e.g. `close`) or
		 * returns handler function for the `contextmenu` event
		 * @param {Function|Array|String} menuItems
		 * @param {Function|Object} config
		 * @returns {?Function}
		 */
		return function (menuItems, config) {
			// allow for `d3.contextMenu('close');` calls
			// to programatically close the menu
			if (menuItems === 'close') {
				return closeMenu();
			}

			// for convenience, make `menuItems` a factory
			// and `config` an object
			menuItems = utils.toFactory(menuItems);

			if (utils.isFn(config)) {
				config = { onOpen: config };
			}
			else {
				config = config || {};
			}

			// resolve config
			var openCallback = config.onOpen || utils.noop;
			var closeCallback = config.onClose || utils.noop;
			var positionFactory = utils.toFactory(config.position);
			var themeFactory = utils.toFactory(config.theme, 'd3-context-menu-theme');

			/**
			 * Context menu event handler
			 * @param {*} data
			 * @param {Number} index
			 */
			return function (data, index) {
				var element = this;

				// close any menu that's already opened
				closeMenu();

				// store close callback already bound to the correct args and scope
				d3ContextMenu = {
					boundCloseCallback: closeCallback.bind(element, data, index)
				};

				// create the div element that will hold the context menu
				d3.selectAll('.d3-context-menu').data([1])
					.enter()
					.append('div')
					.attr('class', 'd3-context-menu ' + themeFactory.bind(element)(data, index));

				// close menu on mousedown outside
				d3.select('body').on('mousedown.d3-context-menu', closeMenu);
				d3.select('body').on('click.d3-context-menu', closeMenu);

				var parent = d3.selectAll('.d3-context-menu')
					.on('contextmenu', function() {
						closeMenu();
						d3.event.preventDefault();
						d3.event.stopPropagation();
					})
					.append('ul');

				parent.call(createNestedMenu, element);

				// the openCallback allows an action to fire before the menu is displayed
				// an example usage would be closing a tooltip
				if (openCallback.bind(element)(data, index) === false) {
					return;
				}

				// get position
				var position = positionFactory.bind(element)(data, index);

				// display context menu
				d3.select('.d3-context-menu')
					.style('left', (position ? position.left : d3.event.pageX - 2) + 'px')
					.style('top', (position ? position.top : d3.event.pageY - 2) + 'px')
					.style('display', 'block');

				d3.event.preventDefault();
				d3.event.stopPropagation();


				function createNestedMenu(parent, root, depth = 0) {
					var resolve = function (value) {
						return utils.toFactory(value).call(root, data, index);
					};

					parent.selectAll('li')
					.data(function (d) {
							var baseData = depth === 0 ? menuItems : d.children;
							return resolve(baseData);
						})
						.enter()
						.append('li')
						.each(function (d) {
							// get value of each data
							var isDivider = !!resolve(d.divider);
							var isDisabled = !!resolve(d.disabled);
							var hasChildren = !!resolve(d.children);
							var hasAction = !!d.action;
							var text = isDivider ? '<hr>' : resolve(d.title);

							var listItem = d3.select(this)
								.classed('is-divider', isDivider)
								.classed('is-disabled', isDisabled)
								.classed('is-header', !hasChildren && !hasAction)
								.classed('is-parent', hasChildren)
								.html(text)
								.on('click', function () {
									// do nothing if disabled or no action
									if (isDisabled || !hasAction) return;

									d.action.call(root, data, index);
									closeMenu();
								});

							if (hasChildren) {
								// create children(`next parent`) and call recursive
								var children = listItem.append('ul').classed('is-children', true);
								createNestedMenu(children, root, ++depth)
							}
						});
				}
			};
		};
	}
));












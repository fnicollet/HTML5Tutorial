 var util = util || {};
/**
 *
 * Lightweight Event Dispatcher class, similar to the EventDispatcher class in ActionScript 3
 * Supports multiple listeners, priorities and stop propagation.
 * Can be used as a local event dispatcher for a component (using composition) or as a pub/sub mechanism if global
 *
 * Annoted for Google Closure Compiler (http://code.google.com/closure/compiler/docs/js-for-compiler.html)
 * @example var bus = new util.EventDispatcher(this);
 * @param {Object} context Scope that will be passed to the event listener callback
 * @author Fabien Nicollet - fnicollet@gmail.com
 * @constructor
 */
util.EventDispatcher = function (context) {
    this.events = [];
    this.context = context;
};
/**
 * Internal map of events
 * @private
 * @type {Array.<Object>}
 */
util.EventDispatcher.prototype.events = null;
/**
 * Internal reference to the original context
 * @private
 * @type {Object}
 */
util.EventDispatcher.prototype.context = null;
/**
 * Add an event listener (callback for a specific event type.
 * Call return false if a listener to stop the event propagation
 * @example bus.addEventListener('someEventType', onSomeEventType);
 * @param {string} type Event type, typically a String that will be stored in your event class
 * @param {function(Object)} callback Reference to the event handler
 * @param {Object=} context Optionnal scope for the event handler
 * @param {number=} priority Positive Number (0 by default). The higher the priority is, the sooner the event handler gets called
 */
util.EventDispatcher.prototype.addEventListener = function (type, callback, context, priority) {
    // default
    priority = priority || 0;
    // add an entry for this event type if not in the map already
    this.events[type] = this.events[type] || {};
    var listenerToInsert = {context:context, callback:callback, priority:priority};
    // same for listeners map (Array) for this event type
    if (this.events[type].listeners) {
        // insert at the right spot
        var listeners = this.events[type].listeners;
        var inserted = false;
        for (var i = 0, l = listeners.length; i < l; i++) {
            var listener = listeners[i];
            var eventPriority = listener.priority;
            if (priority < eventPriority) {
                listeners.splice(i, 0, listenerToInsert);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            listeners.push(listenerToInsert);
        }
    } else {
        this.events[type].listeners = [listenerToInsert];
    }
};
/**
 * Returns wether an event listener is registered for the specified event type (callback parameter specified) or if there is at least one listener specified for the event type (no callback parameter specified)
 * @example bus.hasEventListener('someEventType', onSomeEventType);
 * @example bus.hasEventListener('someEventType');
 * @param {string} type
 * @param {function(Object)=} callback
 * @return {boolean} true if an event listener is registered for the specified event type (callback parameter specified) or true if there is at least one listener specified for the event type (no callback parameter specified)
 */
util.EventDispatcher.prototype.hasEventListener = function (type, callback) {
    var listeners = this.events[type] ? this.events[type].listeners : null;
    if (!listeners) {
        return false;
    }
    // if no callback is provided, check if any callback is defined for this event
    if (!callback) {
        return listeners.length > 0;
    }
    // looking for a specific event
    for (var i = 0, l = listeners.length; i < l; i++) {
        var listener = listeners[i];
        if (listener.callback === callback) {
            return true;
        }
    }
    return false;
};
/**
 * Remove an event handler for a specific type. If no callback is specified, all the event listeners for this event type are removed
 * @example bus.removeEventListener('someEventType', onSomeEventType);
 * @example bus.removeEventListener('someEventType');
 * @param {string} type
 * @param {function(Object)=} callback
 */
util.EventDispatcher.prototype.removeEventListener = function (type, callback) {
    var listeners = this.events[type] ? this.events[type].listeners : null;
    if (!listeners || listeners.length < 1) {
        return false;
    }
    // not defining a callback = remove all listeners
    if (!callback) {
        this.events[type].listeners = [];
        return true;
    }
    for (var i = 0, l = listeners.length; i < l; i++) {
        var listener = listeners[i];
        if (listener.callback === callback) {
            listeners.splice(i, 1);
            return true;
        }
    }
    return false;
};
/**
 * Dispatch and event on the event dispatched that will be caught by one of the event listener if attached.
 * @example bus.dispatchEvent({type:'someEventType, data:{someData:'someDataValue'}});
 * @param {Object} event Any Object with a type property. Data can be passed to the event handler if there is a data property on the event object
 */
util.EventDispatcher.prototype.dispatchEvent = function (event) {
    var type = event.type;
    // default
    var listeners = this.events[type] ? this.events[type].listeners : null;
    if (!listeners || listeners.length < 1) {
        // no listeners for this event
        return;
    }
    for (var i = listeners.length - 1; i >= 0; i--) {
        var listener = listeners[i];
        var callback = listener.callback;
        // merge listener data and event triggered data
        var callbackContext = listener.context ? listener.context : this.context;
        var result = callback.call(callbackContext, event);
        if (result !== undefined && !result) {
            break;
        }
    }
};
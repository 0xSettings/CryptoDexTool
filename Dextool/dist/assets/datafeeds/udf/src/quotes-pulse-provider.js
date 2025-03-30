"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesPulseProvider = void 0;
const helpers_1 = require("./helpers");
var SymbolsType;
(function (SymbolsType) {
    SymbolsType[SymbolsType["General"] = 0] = "General";
    SymbolsType[SymbolsType["Fast"] = 1] = "Fast";
})(SymbolsType || (SymbolsType = {}));
var UpdateTimeouts;
(function (UpdateTimeouts) {
    UpdateTimeouts[UpdateTimeouts["Fast"] = 10000] = "Fast";
    UpdateTimeouts[UpdateTimeouts["General"] = 60000] = "General";
})(UpdateTimeouts || (UpdateTimeouts = {}));
class QuotesPulseProvider {
    _quotesProvider;
    _subscribers = {};
    _requestsPending = 0;
    _timers = null;
    constructor(quotesProvider) {
        this._quotesProvider = quotesProvider;
    }
    subscribeQuotes(symbols, fastSymbols, onRealtimeCallback, listenerGuid) {
        this._subscribers[listenerGuid] = {
            symbols: symbols,
            fastSymbols: fastSymbols,
            listener: onRealtimeCallback,
        };
        this._createTimersIfRequired();
        (0, helpers_1.logMessage)(`QuotesPulseProvider: subscribed quotes with #${listenerGuid}`);
    }
    unsubscribeQuotes(listenerGuid) {
        delete this._subscribers[listenerGuid];
        if (Object.keys(this._subscribers).length === 0) {
            this._destroyTimers();
        }
        (0, helpers_1.logMessage)(`QuotesPulseProvider: unsubscribed quotes with #${listenerGuid}`);
    }
    _createTimersIfRequired() {
        if (this._timers === null) {
            const fastTimer = window.setInterval(this._updateQuotes.bind(this, SymbolsType.Fast), UpdateTimeouts.Fast);
            const generalTimer = window.setInterval(this._updateQuotes.bind(this, SymbolsType.General), UpdateTimeouts.General);
            this._timers = { fastTimer, generalTimer };
        }
    }
    _destroyTimers() {
        if (this._timers !== null) {
            clearInterval(this._timers.fastTimer);
            clearInterval(this._timers.generalTimer);
            this._timers = null;
        }
    }
    _updateQuotes(updateType) {
        if (this._requestsPending > 0) {
            return;
        }
        // eslint-disable-next-line guard-for-in
        for (const listenerGuid in this._subscribers) {
            this._requestsPending++;
            const subscriptionRecord = this._subscribers[listenerGuid];
            this._quotesProvider.getQuotes(updateType === SymbolsType.Fast ? subscriptionRecord.fastSymbols : subscriptionRecord.symbols)
                .then((data) => {
                this._requestsPending--;
                if (!this._subscribers.hasOwnProperty(listenerGuid)) {
                    return;
                }
                subscriptionRecord.listener(data);
                (0, helpers_1.logMessage)(`QuotesPulseProvider: data for #${listenerGuid} (${updateType}) updated successfully, pending=${this._requestsPending}`);
            })
                .catch((reason) => {
                this._requestsPending--;
                (0, helpers_1.logMessage)(`QuotesPulseProvider: data for #${listenerGuid} (${updateType}) updated with error=${(0, helpers_1.getErrorMessage)(reason)}, pending=${this._requestsPending}`);
            });
        }
    }
}
exports.QuotesPulseProvider = QuotesPulseProvider;

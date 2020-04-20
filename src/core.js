import {fromEvent, of, throwError} from "rxjs";
import {map, share} from "rxjs/operators";
import {EventBus} from "@waltz-controls/eventbus";
import Deferred from "./deferred";

export const kExternalChannel = 'channel:external';
export const kInprocChannel = 'channel:inproc';
export const kMulticastChannel = 'channel:multicast';

/**
 * @class [Controller]
 */
export class Controller {
    constructor(name){
        this.name = name;
    }

    /**
     * Dispatches given payload under its name via 'channel:inproc'
     *
     * @param payload
     * @param {string} [topic=this.name] topic
     * @param {string} [channel=kInprocChannel] channel
     */
    dispatch(payload, topic = this.name, channel = kInprocChannel){
        this.middleware.dispatch(topic, channel, payload);
    }

    /**
     *
     * @param {typeof Error|*} err
     * @param {string} [topic=this.name] topic
     * @param {string} [channel=kInprocChannel] channel
     */
    dispatchError(err, topic = this.name, channel = kInprocChannel){
        this.middleware.dispatchError(topic, channel, err);
    }

    /**
     *
     * @param {typeof Observable} observable
     * @param {string} [topic=this.name] topic
     * @param {string} [channel=kInprocChannel] channel
     */
    dispatchObservable(observable, topic = this.name, channel = kInprocChannel){
        this.middleware.dispatchObservable(topic, channel, observable);
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {{next,error}|function(*):void} subscriber
     * @return {Subscription}
     */
    listen(subscriber, topic=this.name, channel=kInprocChannel, ){
        return this.middleware.subscribe(topic,channel, subscriber)
    }

    /**
     * Configure this controller
     *
     * This method is called by the middleware just after registration
     */
    config(){}

    /**
     * Called from {@link Application#run}
     */
    run(){}
}

/**
 * @class [WaltzWidget]
 */
export class WaltzWidget extends Controller {
    constructor(name){
        super(name);
    }

    /**
     * Render this widget
     */
    render(){}
}

/**
 * Main entry point for any Waltz based SP-Applications
 *
 * @example
 * new Application({name: 'waltz', versions: 'x.y.z'})
 * .registerWidget(new Widget())
 * .run()
 *
 * @class [Application]
 */
export class Application {
    constructor({name, version}) {
        this.name = name;
        this.version = version;
        this.context = new Map();
        this.subscriptions = new Map();
        this.middleware = new WaltzMiddleware();
    }

    /**
     *
     * @param {function(Error):void} handler
     * @returns {Application}
     */
    registerErrorHandler(handler){
        fromEvent(window,"error").pipe(
            map(ev => ev.error)
        ).subscribe(handler);
        return this;
    }

    /**
     * Wraps the context with a promise
     *
     * @param {string} id
     * @param {*|PromiseLike<*>} context
     * @returns {Application}
     */
    registerContext(id, context){
        if(this.context.has(id)){
            this.context.get(id).resolve(context);
        } else {
            const deferred = new Deferred()
            this.context.set(id, deferred);
            deferred.resolve(context);
        }
        return this;
    }

    /**
     * Returns a promise of the context requested.
     *
     * The promise is either has been already resolved with a context value or will wait till
     * {@link Application#registerContext} is called.
     *
     * @param id
     * @returns {Promise<*>}
     */
    getContext(id){
        const deferred = this.context.get(id) || new Deferred();
        this.context.set(id, deferred);
        return deferred;
    }

    /**
     * Subscribes to the observable provided so that every next/error is dispatched via the middleware using specified topic and channel.
     *
     * Unsubscribes on completion.
     *
     * If consumers need to tweak the observable use {@link Application#registerContext} instead.
     *
     * @param {string|number|Symbol} id
     * @param {function(Application):Observable|Observable} observableFactory
     * @param {string} [topic=id] topic
     * @param {string} [channel='channel:external'] channel
     * @returns {Application}
     */
    registerObservable(id, observableFactory, topic= id, channel = kExternalChannel){
        if(this.subscriptions.has(id)) throw new Error(`Observable ${id} is already registered!`);
        this.subscriptions.set(id, (typeof observableFactory === 'function' ? observableFactory(this) : observableFactory).subscribe({
            next: payload => this.middleware.dispatch(topic, channel, payload),
            error: err => this.middleware.dispatchError(topic, channel, err),
            complete: () => this.unregisterObservable(id)
        }));
        return this;
    }

    /**
     * Unsubscribes from the observable
     *
     * @param {string|number|Symbol} id
     */
    unregisterObservable(id){
        if(this.subscriptions.has(id)){
            this.subscriptions.get(id).unsubscribe();
            this.subscriptions.delete(id);
        } else {
            console.debug(`Attempt to unregister non-registered observable ${id}`);
        }
    }

    /**
     *
     * @param {typeof Controller} controller
     * @returns {Application}
     */
    registerController(controller){
        this.middleware.registerController(controller);
        return this;
    }

    /**
     *
     * @param {typeof WaltzWidget} widget
     * @returns {Application}
     */
    registerWidget(widget){
        this.registerController(Object.assign(widget, {
            app: this
        }));

        return this;
    }

    getWidget(id){
        return this.middleware._controllers.get(id);
    }

    _safe(what){
        return function(unsafe){
            try{
                unsafe[what]();
            } catch (e) {
                console.error("Failed to render controller!", e);
            }
        }
    }

    /**
     * This application starting point
     *
     * @returns {Application}
     */
    run(){
        this.middleware._controllers.forEach(this._safe('run'));
        return this;
    }
}

/**
 * @class [WaltzMessage]
 */
class WaltzMessage{
    /**
     *
     * @param topic
     * @param channel
     * @param {Observable} payload
     */
    constructor({topic, channel, payload} = {payload: null}){
        this.topic = topic;
        this.channel = channel;
        this.payload = payload;
    }
}


/**
 * @class [WaltzMiddleware]
 */
class WaltzMiddleware {
    constructor(){
        this._controllers = new Map();
        this.bus = new EventBus()
    }

    /**
     *
     * @param {typeof Controller} controller
     * @return {typeof Controller}
     */
    registerController(controller){
        this._controllers.set(controller.name, Object.assign(controller, {middleware: this}));
        controller.config();
        return controller;
    }

    subscribe(topic, channel, subscriber){
        const cb = observable => observable.subscribe(subscriber);
        this.bus.subscribe(topic,cb,channel);
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {*} payload
     */
    dispatch(topic,channel,payload){
        this.bus.publish(topic, of(payload).pipe(share()), channel);
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {typeof Error} err
     */
    dispatchError(topic, channel, err){
        this.bus.publish(topic, throwError(err), channel);
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {typeof Observable} observable
     */
    dispatchObservable(topic,channel,observable){
        this.bus.publish(topic, observable.pipe(share()), channel);
    }
}
import {Observable, of, throwError} from "rxjs";
import {share} from "rxjs/operators";
import {EventBus} from "@waltz-controls/eventbus";

export const kExternalChannel = 'channel:external';
export const kInprocChannel = 'channel:inproc';
export const kMulticastChannel = 'channel:multicast';

/**
 * @class [Controller]
 */
export class Controller extends Observable {
    constructor(name){
        super();
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
     * @param {{next,error}} subscriber
     * @return {Observable}
     */
    listen(topic, channel, subscriber){
        this.middleware.subscribe(topic,channel, subscriber)
    }

    /**
     * Called from {@link Application#run}
     */
    run(){

    }
}

/**
 * @class [WaltzWidget]
 */
export class WaltzWidget extends Controller {
    constructor(name){
        super(name);
    }

    /**
     * Configure this widget
     */
    config(){}

    /**
     * Render this widget
     */
    render(){}
}

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
     * @param {function(event):void} handler
     * @returns {Application}
     */
    registerErrorHandler(handler){
        window.addEventListener("error", handler);
        return this;
    }

    /**
     *
     * @param {string} id
     * @param {*} context
     * @returns {Application}
     */
    registerContext(id, context){
        this.context.set(id, context);
        return this;
    }

    /**
     *
     * @param id
     * @returns {*|null}
     */
    getContext(id){
        return this.context.get(id);
    }

    /**
     *
     * @param {string} id
     * @param {typeof Observable} observable
     * @param {string} topic
     * @param {string} [channel='channel:external'] channel
     * @returns {Application}
     */
    registerObservable(id, observable, topic, channel = kExternalChannel){
        this.subscriptions.set(id, observable.subscribe({
            next: payload => this.middleware.dispatch(topic, channel, payload),
            error: err => this.middleware.dispatchError(topic, channel, err),
            complete: () => this.unregisterObservable(id)
        }));
        return this;
    }

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
        this.registerObservable(controller.name, controller, controller.name, kInprocChannel);
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

export class WaltzMessage{
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



export class WaltzMiddleware {
    constructor(){
        this._controllers = new Map();
        this.bus = new EventBus()
    }

    /**
     *
     * @param {typeof Controller} controller
     */
    registerController(controller){
        this._controllers.set(controller.name, Object.assign(controller, {middleware: this}));
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
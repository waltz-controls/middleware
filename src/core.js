import {Observable, of, Subject, throwError} from "rxjs";
import {filter, share, switchMap, tap} from "rxjs/operators";

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
     */
    dispatch(payload){
        this.middleware.dispatch(this.name, kInprocChannel, payload);
    }

    dispatchError(err){
        this.middleware.dispatchError(this.name, kInprocChannel, err);
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {function(WaltzMessage):*} [mapper=function(WaltzMessage):WaltzMessage] mapper
     * @return {Observable}
     */
    listen(topic, channel, mapper = msg => msg.payload){
        return this.middleware.pipe(
            filter(msg => (msg.topic === topic) && msg.channel === channel),
            tap(msg => {
                console.debug(`Controller ${this.name} has received a message`,msg)
            }),
            switchMap(mapper)
        );
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
        this.subscriptions.set(id, observable.pipe(share()).subscribe({
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



export class WaltzMiddleware extends Subject{
    constructor(){
        super();
        this._controllers = new Map();
    }

    /**
     *
     * @param {typeof Controller} controller
     */
    registerController(controller){
        this._controllers.set(controller.name, Object.assign(controller, {middleware: this}));
        return controller;
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {*} payload
     */
    dispatch(topic,channel,payload){
        this.next(new WaltzMessage({topic,channel,payload:of(payload)}));
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {typeof Error} err
     */
    dispatchError(topic, channel,err){
        this.next(new WaltzMessage({topic,channel,payload:throwError(err)}));
    }
}
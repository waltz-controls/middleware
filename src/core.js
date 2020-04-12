import {Subject} from "rxjs";
import {filter, map, tap} from "rxjs/operators";

export class Controller {
    dispatch(payload){
        this.middleware.dispatch(this.id, kInprocChannel, () => payload);
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {function(WaltzMessage):*} [mapper=function(WaltzMessage):WaltzMessage] mapper
     */
    listen(topic, channel, mapper = msg => msg){
        return this.middleware.pipe(
            filter(msg => msg.topic === topic && msg.channel === channel),
            tap(msg => {
                console.debug(`Controller ${this.id} has received a message`,msg)
            }),
            map(mapper),
        );
    }

    config(){

    }
}

/**
 * @class [WaltzWidget]
 */
export class WaltzWidget extends Controller {
    /**
     *
     */
    render(){}

    /**
     *
     */
    run(){}
}

export class Application {
    constructor({name, version}) {
        this.name = name;
        this.version = version;
        this.context = new Map();
        this.middleware = new WaltzMiddleware();
    }

    registerErrorHandler(handler){
        window.addEventListener("error", handler);
        return this;
    }

    registerContext(id, context){
        this.context.set(id, context);
        return this;
    }

    getContext(id){
        return this.context.get(id);
    }

    /**
     *
     * @param {string} id
     * @param {typeof WaltzWidget} widget
     * @returns {Application}
     */
    registerWidget(id, widget){
        Object.assign(this.middleware.registerController(id, widget), {
            app: this
        });

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

    config(){
        this.middleware._controllers.forEach(this._safe('config'));
        return this;
    }

    render(){
        this.middleware._controllers.forEach(this._safe('render'));
        return this;
    }

    run(){
        this.middleware._controllers.forEach(this._safe('run'));
        return this;
    }
}

export class WaltzMessage{
    constructor({topic, channel, payload} = {payload: null}){
        this.topic = topic;
        this.channel = channel;
        this.payload = payload;
    }
}

export const kInprocChannel = 'inproc';

export class WaltzMiddleware extends Subject{
    constructor(){
        super();
        this._controllers = new Map();
    }

    /**
     *
     * @param id
     * @param {typeof Controller} controller
     */
    registerController(id, controller){
        this._controllers.set(id, Object.assign(controller, {id, middleware: this}));
        return controller;
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {function(WaltzMiddleware):Action} payloadFactory
     */
    dispatch(topic,channel,payloadFactory){
        this.next(new WaltzMessage({topic,channel,payload:payloadFactory(this)}));
    }
}
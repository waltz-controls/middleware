import {Subject} from "rxjs";

export class Context{
    constructor(){
        this.context = new Map();
    }

    registerContext(key, context){
        this.context.set(key, context);
        return this;
    }

    get(key){
        return this.context.get(key);
    }
}

export class Engine {
    render(layout){

    }
}

export class ApplicationUI{
    constructor(layout, engine){
        this.layout = layout;
        this.engine = engine;
    }

    build(){
        return this.layout;
    }

    render(){
        const ui = this.build();
        this.engine.render(ui);
    }
}

/**
 * @class [Controller]
 */
export class Controller {
    constructor(middleware) {
        this.middleware = middleware;
    }


    /**
     *
     * @param {Application} app
     */
    render(app){}

    /**
     *
     * @param {Application} app
     */
    run(app){}
}

export class Application {
    constructor({name, version, ui}) {
        this.name = name;
        this.version = version;
        this.context = new Context();
        this.middleware = new WaltzMiddleware();
        this.ui = ui;
    }

    registerErrorHandler(handler){
        window.addEventListener("error", handler);
        return this;
    }

    registerContext(id, context){
        this.context.registerContext(id, context);
        return this;
    }

    /**
     *
     * @param {string} id
     * @param {function(WaltzMiddleware):Controller} factory
     * @returns {Application}
     */
    registerController(id, factory){
        this.middleware.registerController(id, factory);
        return this;
    }


    _safeRender(renderable){
        try {
            renderable.render(this);
        } catch (e) {
            console.error("Failed to render controller!", e);
        }
    }

    _safeRun(runnable){
        try {
            runnable.run(this);
        } catch (e) {
            console.error("Failed to run controller!", e);
        }
    }

    render(){
        this.middleware._controllers.forEach(this._safeRender.bind(this));
        this.ui.render();
        return this;
    }

    run(){
        this.middleware._controllers.forEach(this._safeRun.bind(this));
        return this;
    }
}

export class WaltzMessage{
    constructor({source, channel, payload} = {payload: null}){
        this.source = source;
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
     * @param id
     * @param {function(WaltzMiddleware):Controller} factory
     */
    registerController(id, factory){
        this._controllers.set(id, factory(this))
    }

    /**
     *
     * @param {string} topic
     * @param {string} channel
     * @param {function(WaltzMiddleware):Action} factory
     */
    dispatch(topic,channel,factory){
        this.next(new WaltzMessage({topic,channel,payload:factory(this)}));
    }
}
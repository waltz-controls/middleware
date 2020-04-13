import {kInprocChannel, WaltzWidget} from "../src/core";

const top = webix.protoUI({
    name: 'top',
    $init(config){
        webix.alert('Init top');
        webix.extend(config,{
            rows:[
                {template:'top - protoUI', on:{
                        onBeforeRender(ev){
                            alert(config.root.app.getContext('tango-rest'));
                        }
                    }}
            ]
        })

    }
}, webix.ui.layout);

class TopWidget extends WaltzWidget{
    constructor(root){
        super();
        this.root = root;
    }

    config(){
        return Object.assign(this, {view:'top'})
    }
}

export class MainWindow extends WaltzWidget {
    constructor(){
        super('main');
        this.top = new TopWidget(this);
    }

    config(){
        return Object.assign(this,{view:'top'})
    }

    render(){
        webix.ui({
            rows: [
                this.top.config(),
                {cols:[
                        {template:'left'},
                        {template:'main'},
                        {template:'right'}
                    ]},
                {template: 'bottom'}
            ]
        });
        webix.ui.fullScreen();
    }

    run(){
        this.listen(
            'login', kInprocChannel
        ).subscribe(
            {next:msg => {
                this.render();

                webix.alert({text:`${msg.user}:${msg.passwd}`});

                webix.alert({text:`${this.app.getContext('tango-rest')}`});
            },error: () => {}});

        this.listen(
            'numbers', 'numbers'
        ).subscribe(
            payload => {
                console.log(payload)
            });

    }
}
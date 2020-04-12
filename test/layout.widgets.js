import {WaltzWidget, kInprocChannel} from "../src/core";

export class MainWindow extends WaltzWidget {
    config(){
        this.ui = {
            rows: [
                {template:'top'},
                {cols:[
                        {template:'left'},
                        {template:'main'},
                        {template:'right'}
                    ]},
                {template: 'bottom'}
            ]
        };

        this.listen(
            'login', kInprocChannel,msg => msg.payload
        ).subscribe(
            msg => {

                webix.ui(this.ui);
                webix.ui.fullScreen();

                webix.alert({text:`${msg.user}:${msg.passwd}`});

                webix.alert({text:`${this.app.getContext('tango-rest')}`});
            });


    }

    render(){

    }

    run(){


    }
}
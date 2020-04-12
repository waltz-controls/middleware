import {ApplicationUI, Engine} from "./core";
/**
 * @class
 */
export class WebixEngine extends Engine{
    render(layout){
        webix.ui(layout);
    }
}

export class DefaultWebixWaltzUI extends ApplicationUI {
    static ui(){
        return {
            rows:[
                {
                    template:'top'
                },
                {
                    cols:[
                        {
                            template: 'left'
                        },
                        {
                            template: 'main'
                        },
                        {
                            template: 'right'
                        }
                    ]
                },
                {
                    template: 'bottom'
                }
            ]
        }
    }
    constructor(){
        super(DefaultWebixWaltzUI.ui(),new WebixEngine())
    }

    //TODO modifiers
}
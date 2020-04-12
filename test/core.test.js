import {Application} from "../src/core";
import {DefaultWebixWaltzUI} from "../src/webix";


new Application({name:'waltz', version:'1.0.0', ui: new DefaultWebixWaltzUI()})
    .registerContext('tango-rest', "some context")
    .render()
    .run();


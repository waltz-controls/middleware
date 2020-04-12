import {Application} from "../src/core";
import {MainWindow} from "./layout.widgets";
import {Login} from "./login.widget";


new Application({name:'waltz', version:'1.0.0'})
    .registerContext('tango-rest', "some context")
    .registerWidget('login', new Login())
    .registerWidget('main', new MainWindow())
    .config()
    .render()
    .run();


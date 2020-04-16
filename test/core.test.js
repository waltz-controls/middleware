import {Application} from "../src/core";
import {MainWindow} from "./layout.widgets";
import {Login} from "./login.widget";
import {interval, throwError, timer} from "rxjs";
import {mergeMap, throttleTime} from "rxjs/operators";


const app = new Application({name:'waltz', version:'1.0.0'})
    .registerContext('tango-rest', "some context")
    .registerObservable(1234, () => interval(100).pipe(throttleTime(1000)),'numbers', "numbers")
    .registerObservable(1235, () => timer(3000).pipe(mergeMap(() => throwError("Kabo-o-o-om"))),'numbers', "numbers")
    // .registerObservable(1236, timer(1000).pipe(mergeMap(() => of([1,2,3,4]))),'numbers', "numbers")
    .registerWidget(new Login())
    .registerWidget(new MainWindow())
    .run();

setTimeout(()=>{
    app.unregisterObservable(1234);
    app.unregisterObservable(1235);
    app.unregisterObservable(1236);
},10000);


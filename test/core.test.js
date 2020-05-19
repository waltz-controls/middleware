import {Application} from "../src/core";
import {MainWindow} from "./layout.widgets";
import {Login} from "./login.widget";
import {interval, throwError, timer} from "rxjs";
import {mergeMap, throttleTime} from "rxjs/operators";


const app = new Application({name:'waltz', version:'1.0.0'})
    .registerErrorHandler(err => {console.error(err)})
    .registerContext('tango-rest', Promise.resolve("some context"))
    .registerObservable(1234, () => interval(100).pipe(throttleTime(1000)),'numbers', "numbers")
    .registerObservable(1235, () => timer(3000).pipe(mergeMap(() => throwError("Kabo-o-o-om"))),'numbers', "numbers")
    // .registerObservable(1236, timer(1000).pipe(mergeMap(() => of([1,2,3,4]))),'numbers', "numbers")
    .registerWidget(app => new Login(app))
    .registerWidget(app => new MainWindow(app))
    .run();

setTimeout(()=>{
    app.unregisterObservable(1234);
    app.unregisterObservable(1235);
    app.unregisterObservable(1236);
},10000);


throw new Error("O-o-ops!");
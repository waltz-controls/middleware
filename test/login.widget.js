import {WaltzWidget} from "../src/core";
import {of} from "rxjs";
import {skip} from "rxjs/operators";

export class Login extends WaltzWidget {
    constructor(app) {
        super('login', app);

        this.listen({
            next: () => $$('login').destructor(),
            error: err => console.error(err)
        });

        this.listen({
            next: payload => console.log(payload)
        },'obs');

        this.listen({
                next:payload => console.log(`payload: ${payload}`),
                error:error => console.error(error)},
            'numbers', 'numbers');
    }

    ui(){
        const self = this;
        return {
            rows: [
                {
                    rows: [
                        {},
                        {
                            cols: [{}, {
                                view: "form",
                                id: 'frmLogin',
                                elements: [
                                    {
                                        view: "text",
                                        name: "username",
                                        label: "Username",
                                        validate: webix.rules.isNotEmpty,
                                        invalidMessage: "Username can not be empty"
                                    },
                                    {
                                        view: "text",
                                        name: "password",
                                        type: "password",
                                        label: "Password",
                                        validate: webix.rules.isNotEmpty,
                                        invalidMessage: "Password can not be empty"
                                    },
                                    {
                                        cols: [
                                            {
                                                id:'btnLogin',
                                                view: "button",
                                                value: "Login",
                                                type: "form",
                                                hotkey: "enter",
                                                click(){
                                                    var form = this.getFormView();
                                                    var isValid = form.validate();
                                                    if (!isValid) {
                                                        self.dispatchError("Invalid login!!!");
                                                        return;
                                                    }

                                                    self.dispatch({
                                                        user: form.getValues().username,
                                                        passwd: form.getValues().password
                                                    });

                                                    self.dispatchObservable(of(1,2,3,4,5).pipe(skip(2)), 'obs');
                                                }
                                            },
                                            {
                                                view: "button", value: "Cancel", click: function () {
                                                    var form = this.getFormView();
                                                    form.clear();
                                                    form.clearValidation();
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }, {}]

                        },
                        {}
                    ]
                }
            ]
        };

    }

    render(){
        return webix.ui({
            id:'login',
            view:'window',
            fullscreen:true,
            body:this.ui()
        })
    }


    run() {
        this.render().show();
    }
}
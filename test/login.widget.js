import {kInprocChannel, WaltzWidget} from "../src/core";

export class Login extends WaltzWidget {
    constructor() {
        super('login');

    }


    config() {
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
                                                    })
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
            body:this.config()
        })
    }


    run() {
        this.listen('login', kInprocChannel).subscribe({
            next: () => $$('login').destructor(),
            error: err => console.error(err)
        });

        this.listen(
            'numbers', 'numbers'
        ).subscribe(
            payload => console.log(`payload: ${payload}`),
            error => console.error(error)
        );

        this.render().show();
    }
}
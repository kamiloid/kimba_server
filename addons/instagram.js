const {app_conf, db_conf, serve_conf} = require('../core/conf/conf.js');
const {tools} = require('../core/conf/tools.js');
const Instagram = require('instagram-web-api');
const curl = require('curlrequest');

exports.instagram =
{
    login: (data, callback = null)=>
    {
        data.o.error = false;

        const user = app_conf._instagram.user;
        const pass = app_conf._instagram.pass;

        const client = new Instagram({username: user, password: pass});

        client.login().then((res1)=>
        {
            if(callback)
            {
                callback({client: client, login: res1});
                return;
            }
            data.o.login = res1;
            return data.callback(data.o);
        });
        
    },
    get_user_data:function(data, callback = null)
    {
        this.login(data, (res1)=>
        {
            console.log(data.i.username);
            res1.client.getUserByUsername({ username: data.i.username }).then((res2)=>
            {
                data.o.instagram = res2;
                data.callback(data.o);
            });
        });
    }
}
const {app_conf, db_conf, serve_conf} = require('../core/conf/conf.js');
const {tools} = require('../core/conf/tools.js');

exports.sm_manager =
{
    add_account: (data, callback = null)=>
    {
        data.o.logged = false;
        let session = serve_conf.check_session_by_ip_browser(data.client.ip, data.client.browser);
        let old_token = session.token;
        if(old_token !== data.i.token && (data.i.token !== null && data.i.token !== undefined))
        {
            if(callback){
                callback({error: true});
                return;
            }
            serve_conf.remove_session(old_token);
            serve_conf.remove_session(data.i.token);
            data.o.message = 'Tokens do not match.';
            return data.callback(data.o);
        }

//         token: '04907f0ceda7251942cd6ddf4170d483',
//   user_uid: 'aef1d82f631b0eb75237cf8e43a51ee2',
//   expire: 2021-10-01T12:49:49.000Z,
//   user_name: 'user_test2',
//   first_name: 'User test 2',
//   last_name: 'User test 2',
//   email: 'user_test2@gmail.com',
//   ip: 'localhost',
//   browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'

        let query = `SELECT uid FROM sm_accounts WHERE sm_username = '${data.i.username}' AND sm_type = '${data.i.type}';`;
        let update = false;
        if(data.i.id.trim() !== '')
        {
            update = true;
            query = `SELECT uid FROM sm_accounts WHERE uid = '${data.i.id}';`;
        }

        data.mysql.query(query,
        (res1)=>
        {
            let uid = tools.uid();
            if(res1.result.length >= 1 && !update)
            {
                uid = res1.result[0].uid;
                if(callback){
                    callback(res1);
                    return;
                }
                return data.callback(data.o);
            }
            
            let date_create = tools.date.date_time_read();

            let query2 = `INSERT INTO sm_accounts (uid, user_uid, sm_username, sm_type, date_create) VALUES ('${uid}', '${session.user_uid}', '${data.i.username}', '${data.i.type}', '${date_create}');`;
            if(update)
                query2 = `UPDATE sm_accounts SET sm_username = '${data.i.username}', sm_type = '${data.i.type}' WHERE uid = '${data.i.id}';`;

            data.mysql.query(query2,
            (res2)=>
            {
                if(callback){
                    callback(res1);
                    return;
                }
                // update sm_username
                return data.callback(data.o);
            });
        });
    },
    get_accounts:(data, callback)=>
    {
        data.o.logged = false;
        let session = serve_conf.check_session_by_ip_browser(data.client.ip, data.client.browser);
        let old_token = session.token;
        if(old_token !== data.i.token && (data.i.token !== null && data.i.token !== undefined))
        {
            if(callback){
                callback({error: true});
                return;
            }
            serve_conf.remove_session(old_token);
            serve_conf.remove_session(data.i.token);
            data.o.message = 'Tokens do not match.';
            return data.callback(data.o);
        }


        data.o.accounts = [];
        data.mysql.query(`SELECT uid, sm_username, status, sm_type FROM sm_accounts WHERE user_uid = '${session.user_uid}' AND removed = '0' ORDER BY date_create ASC;`,
        (res1)=>
        {
            for(let a of res1.result)
            {
                data.o.accounts.push({
                    username: a.sm_username,
                    type: a.sm_type,
                    id: a.uid,
                    status: a.status
                });
            }

            return data.callback(data.o);
        });
    }
}
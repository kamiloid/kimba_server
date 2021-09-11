const {app_conf, db_conf, serve_conf} = require('../core/conf/conf.js');
const {tools} = require('../core/conf/tools.js');

exports.sm_accounts =
{
    get_active_FBapp: (data, callback)=>
    {
        data.mysql.query(`SELECT name, app_id, scopes FROM fb_apps WHERE status = '1' LIMIT 1;`,
        (resp)=>
        {
            if(resp.result.length === 0)
            {
                data.o.error = true;
                data.o.message = 'The app does not have an Facebook app linked in DB.';
                if(callback)
                    callback({error: data.o.error, message: data.o.message});
                return data.callback(data.o);
            }
            let app_data =
            {
                name: resp.result[0].name,
                id: resp.result[0].app_id,
                scopes: resp.result[0].scopes
            }
            if(callback)
                callback(app_data);
            data.o['fbapp'] = app_data;
            return data.callback(data.o);
        });
    },
    check_fb_account:(data, callback=null)=>
    {   
        let session = serve_conf.check_session_by_token(data.i.token);
        // console.log(data.i.token);
        // console.log(serve_conf._session);
        if(!session)
        {
            data.o.error = true;
            data.o.message = 'Session does not exist.';
            return data.callback(data.o);
        }
        data.mysql.query(
            `SELECT fbid FROM facebook_users WHERE user_uid='${session.user_uid}' AND status='1';`,
            (resp)=>
            {
                let query = resp.result.length > 0 ? resp.result[0] : null;
                if(callback)
                    return callback(query);

                data.o['fb_userid'] = query !== null ? query.fbid : -1;
                data.callback(data.o);
            });
    },
    save_fb_account:function(data, callback)
    {
        let session = serve_conf.check_session_by_token(data.i.token);
        if(!session)
        {
            data.o.error = true;
            data.o.message = 'Session does not exist.';
            return data.callback(data.o);
        }
        this.check_fb_account(data, (resp)=>
        {
            if(resp === null)
            {
                // create a new regiter
                let uid = tools.uid();
                data.mysql.query(
                    `INSERT INTO facebook_users (uid, user_uid, fbid, date_time) VALUES ('${uid}', '${session.user_uid}', '${data.i.fb_userid}', '${tools.date.date_time_read()}');`,
                    (resp)=>{});
            }
            data.o.error = false;
            return data.callback(data.o);
        });
    },
    remove_fb_account:function(data, callback)
    {
        let session = serve_conf.check_session_by_token(data.i.token);
        if(!session)
        {
            data.o.error = true;
            data.o.message = 'Session does not exist.';
            return data.callback(data.o);
        }
        this.check_fb_account(data, (resp)=>
        {
            if(resp !== null)
            {
                if(data.i.fb_userid !== resp.fbid)
                {
                    data.o.error = true;
                    data.o.message = 'There is a problem with Facebook\'s user id in this session.';
                    return data.callback(data.o);
                }
                data.mysql.query(
                    `UPDATE facebook_users SET status='0', end_date = '${tools.date.date_time_read()}' WHERE user_uid = '${session.user_uid}' AND fbid = '${data.i.fb_userid}' AND status = '1';`,
                    (resp)=>{});
            }
            data.o.error = false;
            return data.callback(data.o);
        });
    },
    save_fb_posts:function(data, callback)
    {
        let session = serve_conf.check_session_by_token(data.i.token);
        if(!session)
        {
            data.o.error = true;
            data.o.message = 'Session does not exist.';
            return data.callback(data.o);
        }
        if(!data.i.posts)
        {
            data.o.error = true;
            data.o.message = 'Post object does not exist.';
            return data.callback(data.o);
        }
        if(!data.i.posts.data)
        {
            data.o.error = true;
            data.o.message = 'Post data collection does not exist.';
            return data.callback(data.o);
        }

        let buffer = data.i.posts.data;
        let values = '';
        let post_comma = '';
        let total = buffer.length || 0;
        let cont = 0;
        for(p in buffer)
        {
            let post = buffer[p];
            data.mysql.query(`SELECT uid FROM fb_posts WHERE post_id = '${post.id}' LIMIT 1;`, 
            (resp1)=>
            {
                if(resp1.result.length === 0)
                {
                    let post_uid = tools.uid();
                    let likes = post.like ? ( post.like.summary ? post.like.summary.total_count : 0 ) : 0;
                    values += `${post_comma}('${post_uid}', '${session.user_uid}', '${post.message}', '${post.id}', '${likes}', '${post.created_time}', '${tools.date.date_time_read()}')`;
                    post_comma = ',';

                }
                cont++;
                if(cont >= total)
                {
                    console.log('-----------------------------------------------------------------------------------------------');
                    console.log('-----------------------------------------------------------------------------------------------');
                    console.log(`INSERT INTO fb_posts (uid, user_uid, message, post_id, num_reactions, sync_date) VALUES ${values}`);
                    console.log('-----------------------------------------------------------------------------------------------');
                    console.log('-----------------------------------------------------------------------------------------------');
                    if(values.trim() === '')
                    {
                        data.o.message = 'No insert.';
                        return data.callback(data.o);
                    }
                    data.mysql.query(`INSERT INTO fb_posts (uid, user_uid, message, post_id, num_reactions, post_date, sync_date) VALUES ${values}`,
                    (resp2)=>
                    {
                        return data.callback(data.o);
                    });
                }
            });
        }
    },
    get_fb_analytic:function(data, callback)
    {
        let session = serve_conf.check_session_by_token(data.i.token);
        if(!session)
        {
            data.o.error = true;
            data.o.message = 'Session does not exist.';
            return data.callback(data.o);
        }
        let count = 0;
        let sum = 0;
        data.mysql.query(`SELECT COUNT(num_reactions) AS posts, SUM(num_reactions) AS reacts, (SUM(num_reactions) / COUNT(num_reactions)) FROM fb_posts WHERE user_uid = '${session.user_uid}';`,
        (resp1)=>
        {
            if(resp1.result.length > 0)
            {
                let buffer = resp1.result;
                count = buffer[0].posts;
                sum = buffer[0].reacts;
            }
            
            data.o['count'] = count;
            data.o['sum'] = sum;
            return data.callback(data.o);
        });
    }
}
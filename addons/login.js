const {app_conf, db_conf, serve_conf} = require('../core/conf/conf.js');
const {tools} = require('../core/conf/tools.js');

exports.login =
{
	get_db_session_by_ip_browser:(data, callback)=>
	{
		data.mysql.select({
			table: 'users_login',
			fields: ['id', 'uid', 'token', 'expire_date', 'user_uid'],
			where:{
				equal: [{ip: data.client.ip, browser: data.client.browser, status: 1}]
			}
		}, callback);
	},
	get_db_user_data:(data, user_uid, callback)=>
	{
		data.mysql.select({
			table: 'users',
			fields:['user_name', 'first_name', 'last_name', 'email'],
			where:{
				equal: [{uid: user_uid, status: 1}]
			}
		}, callback);
	},
	change_token:(data, token, callback)=>
	{
		let new_token = serve_conf.update_session_token(token);
		data.mysql.update({
			table:'users_login',
			fields: {token: new_token},
			where:{
				equal: [{token: token}]
			}
		}, (resp)=>
		{
			if(callback)
				callback(new_token);
		});
	},
	logout:function(data)
	{
		// console.log(data.i);
		data.o['logged'] = false;
		let session = serve_conf.check_session_by_ip_browser(data.client.ip, data.client.browser);
		data.mysql.query(`UPDATE users_login SET status = '0', out_date = '${tools.date.date_time_read()}' WHERE token = '${data.i.token}';`,
		(resp)=>
		{
			// serve_conf.remove_session(session.token);
			serve_conf.remove_session(data.i.token);
			data.o.session = {};
			data.callback(data.o);
		});
	},
	check_session:function(data)
	{
		data.o['logged'] = false;
		// 1. get a opened session in server
		let session = serve_conf.check_session_by_ip_browser(data.client.ip, data.client.browser);
		// 2. check if the opened session exist
		// 2.1. if it does not exist, then we have to consult if the session is opened in the db
		//console.log('session: ', session);
		if(!session)
		{
			this.get_db_session_by_ip_browser(data, (resp)=>
			{
				// 2.2 if the session does not exist in the db, then return logged as false
				if(resp.result.length == 0)
				{
					data.o.message = 'User is not logged currently.';
					return data.callback(data.o);
				}
				// console.log(resp);
				let result = resp.result[0];
				// 2.3 if the session exist, we have to know if this one is opened currently
				let today = tools.date.now();
				let expire = tools.date.date(result.expire_date);
				// 2.4 if the session is not opened, return logged as false
				if(today.getTime() > expire.getTime())
				{
					data.o.message = 'User is not logged currently.';
					return data.callback(data.o);
				}
				// 2.5 if the session exists and is opened, we have to consult in the db the basic data of the user
				// 'token', 'expire_date', 'user_uid'
				this.get_db_user_data(data, result.user_uid, (resp2)=>
				{
					if(resp2.result.length == 0)
					{
						data.o.message = 'User does not exist or is banned.';
						return data.callback(data.o);
					}
					let result2 = resp2.result[0];
					// 2.6 if the session exists and is opened, returns logged as true
					data.o.session['token'] = result.token;
					data.o.session['user_name'] = result2.user_name;
					data.o.session['first_name'] = result2.first_name;
					data.o.session['last_name'] = result2.last_name;
					data.o.session['email'] = result2.email;

					serve_conf.set_session({
						token: data.o.session['token'],
						user_uid: result.user_uid,
						expire: result.expire_date,
						user_name: data.o.session['user_name'],
						first_name: data.o.session['first_name'],
						last_name: data.o.session['last_name'],
						email: data.o.session['email'],
						ip: data.client.ip,
						browser: data.client.browser
					}, result.token);
					data.o.logged = true;
					return data.callback(data.o);
				});
			});
		}else{
			// 3. if the session exist
			// 3.1 we have to compare the new token with the old token
			data.o.logged = false;
			let old_token = session.token;
			if(old_token !== data.i.token && (data.i.token !== null && data.i.token !== undefined))
			{
				serve_conf.remove_session(old_token);
				serve_conf.remove_session(data.i.token);
				data.o.message = 'Tokens do not match.';
				return data.callback(data.o);
			}
			// 3.2 we have to compare the expiring date
			let today = tools.date.now();
			let expire = session.expire;
			if(today.getTime() > expire.getTime())
			{
				serve_conf.remove_session(old_token);
				serve_conf.remove_session(data.i.token);
				data.o.message = 'The session is expired.';
				return data.callback(data.o);
			}
			// 3.3 we have to change the token
			this.change_token(data, old_token, (resp)=>
			{
				data.o.session['token'] = resp;
				data.o.session['user_name'] = session.user_name;
				data.o.session['first_name'] = session.first_name;
				data.o.session['last_name'] = session.last_name;
				data.o.session['email'] = session.email;
				data.o.logged = true;

				return data.callback(data.o);
			});
		}
	},
	try:(data)=>
	{
		data.mysql.query(`SELECT uid, status, id, first_name, last_name, email FROM users WHERE user_name = '${data.i.username}' AND pass = '${data.i.pass}' LIMIT 1;`,
		(resp)=>
		{
			if(resp.result.length == 0)
			{
				data.o.error = true;
				data.o.message = 'User does not exist or is banned.';
				return data.callback(data.o);
			}

			data.mysql.query(`SELECT token, expire_date FROM users_login WHERE ip = '${data.client.ip}' AND browser = '${data.client.browser}' AND user_uid = '${resp.result[0].uid}' AND status = '1' LIMIT 1;`,
			(resp2)=>
			{
				let create_session = true;
				let token = '';
				let now = tools.date.now();
				let expire_date = tools.date.add_days(now, app_conf._expire_date_days);
				if(resp2.result.length >= 1)
				{
					create_session = false;
					token = resp2.result[0].token;
					let expire_date = tools.date.date(resp2.result[0].expire_date);
					if(tools.date.now().getTime() > expire_date)
						create_session = true;
				}
				if(create_session)
				{
					let session_uid = tools.uid();
					token = tools.uid();
					let today_date_time = tools.date.date_time_read(now);
					let expire_date_time = tools.date.date_time_read(expire_date);
					data.mysql.insert({
						table: 'users_login',
						values: {
							uid: session_uid,
							user_uid: resp.result[0].uid,
							date_time: today_date_time,
							ip: data.client.ip,
							expire_date: expire_date_time,
							browser: data.client.browser,
							token: token
						}
					}, (resp3)=>
					{

					});
				}

				serve_conf.set_session({
					token: token,
					user_uid: resp.result[0].uid,
					expire: expire_date,
					user_name: data.i.username,
					first_name: resp.result[0].first_name,
					last_name: resp.result[0].last_name,
					email: resp.result[0].email,
					ip: data.client.ip,
					browser: data.client.browser
				}, token);
				
				data.o.session = {
					token: token,
					user_name: data.i.username,
					first_name: resp.result[0].first_name,
					last_name: resp.result[0].last_name,
					email: resp.result[0].email,
				}
				return data.callback(data.o);


			});
		});
	},
	signin:(data)=>
	{
		data.mysql.select({
			table: 'users',
			fields: ['uid'],
			where:{
				equal: [{user_name:data.i.user_name}, {email: data.i.email}]
			}
		}, (resp1)=>
		{
			if(resp1.result.length >= 1)
			{
				data.o.error = true;
				data.o.message = 'User exist already';
				return data.callback(data.o);
			}else{
				let user_uid = tools.uid();
				data.mysql.insert({
					table: 'users',
					values: {
						uid: user_uid,
						user_name: data.i.user_name,
						pass: data.i.pass,
						email: data.i.email,
						first_name: data.i.first_name,
						last_name: data.i.last_name,
						date_time: tools.date.date_time_read()
					}
				}, (resp2)=>
				{
					//tools.log(resp2);
					if(resp2.code_error) return data.callback({error: true, message: 'Error signing the user'});
					let dbid = resp2.id;
					return data.callback(data.o);
				});
			}
		});
	}
}

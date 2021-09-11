require('dotenv').config();

exports.app_conf =
{
	_debug: process.env.DEBUG === '1',
	_app_name: process.env.APP_NAME,
	_prefix: process.env.PREFIX,
	_expire_date_days: process.env.EXPIRES_IN || 30,
	_instagram: JSON.parse(process.env.INSTAGRAM)
}
exports.serve_conf =
{
	_port: process.env.PORT,
	_session: {},
	check_session_by_token:function(token)
	{
		return this._session[token];
	},
	update_session_token:function(token)
	{
		const {tools} = require('./tools.js');
		let session = this.check_session_by_token(token);
		if(!session) return null;
		let new_token = tools.uid();
		session.token = new_token;
		this._session[new_token] = session;
		delete this._session[token];
		return new_token;
	},
	set_session:function(data, token)
	{
		this._session[token] = data;
	},
	remove_session:function(token)
	{
		if(this._session[token])
			delete this._session[token];
	},
	check_session_by_ip_browser:function(ip, browser)
	{
		for(s in this._session)
		{
			if(this._session[s].ip == ip && this._session[s].browser == browser)
				return this._session[s];
		}
		return null;
	}
}
exports.db_conf =
{
	_mongo1: JSON.parse(process.env.MONGO1),
	_mysql1: JSON.parse(process.env.MYSQL1)
	// _mongo_main: {
	// 	_db: 'Delivery_tracker',
	// 	_user: 'andrescamilo',
	// 	_pass: 'Aclopez01'
	// }
}

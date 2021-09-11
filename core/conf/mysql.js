var mysql = require('mysql');
const {tools} = require('./tools.js');

exports.mysql =
{
	_is_connected: false,
	_time_conn: 0,
	_conn: null,
	_db: null,
	_host: '',
	_dbstr: '',
	_user: '',
	_pass: '',
	connected:function(){return this._is_connected;},
	setup:function(host, db, user, pass)
	{
		this._host = host;
		this._dbstr = db;
		this._user = user;
		this._pass = pass;
	},
	public: function(){
		return {_conn: this._conn, select: this.select, insert: this.insert, update: this.update, delete: this.delete, query: this.query}
	},
	connect: function(cback = null, error_cback = null)
	{
		if(this._is_connected)
		{
			tools.log('MYSQL is already connected');
			return;
		}
		let init_time = (new Date()).getTime();
		this._conn = mysql.createConnection(
			{
				host: this._host,
				user: this._user,
				password: this._pass,
				database: this._dbstr
			});
		this._conn.connect((err)=>
			{
				this._time_conn = (new Date()).getTime() - init_time;
				tools.log(this._time_conn / 1000);
				if(err){
					if(error_cback){
						error_cback(err);
						return;
					}
				}
				this._is_connected = true;
				if(cback)
					cback();
			});
	},
	query: function(q, callback)
	{
		this._conn.query(q, (err, result, fields)=>
			{
				if(callback)
					callback({err, result});
			});
	},
	query_error: function(message, callback)
	{
		let msg = 'MySQL: Invalid query typed!!!';
		message = message || msg;
		message = message.trim() == '' ? msg : message;
		if(callback)
			callback({code_error: true, message: message});
	},
	select: function(conf, callback)
	{
		if(!conf) return this.query_error('MYSQL: No data input defined in SELECT', callback);
		if(typeof(conf) == 'string')
		{
			this.query(conf, callback);
			return;
		}
		if(!conf.table) return this.query_error('MYSQL: No table defined input in SELECT', callback);

		conf['fields'] = conf.fields || '*';
		let fieldsstr = conf.fields;
		if(Array.isArray(fieldsstr))
		{
			fieldsstr = '';
			let comma = '';
			for(f of conf.fields)
			{
				fieldsstr += `${comma}${f}`;
				comma = ',';
			}
		}
		//EQUAL CONDITIONS
		let where = conf.where || '1';
		if(typeof(conf.where) == 'object')
		{
			where = '';
			if(conf.where.equal)
			{
				let cond_or = '';
				for(e of conf.where.equal)
				{
					let conds_val = '';
					let cond_and = '';
					for(f in e)
					{
						conds_val += `${cond_and} ${f}='${e[f]}'`;
						cond_and = ' and';
					}
					where += `${cond_or} (${conds_val})`;
					cond_or = ' or';
				}
			}
		}
		//LIKE CONDITIONS

		let query = `SELECT ${fieldsstr} FROM ${conf.table} WHERE ${where};`;
		// tools.log(query);
		this.query(query, callback);
	},
	insert: function(conf, callback)
	{
		if(!conf) return this.query_error('MYSQL: No data input defined in INSERT', callback);
		if(typeof(conf) == 'string')
		{
			this.query(conf, callback);
			return;
		}
		if(!conf.table) return this.query_error('MYSQL: No table defined input in SELECT', callback);

		let fields = '';
		let values = '';

		if(typeof(conf.values) == 'object')
		{
			let comma = '';
			for(v in conf.values)
			{
				fields += `${comma}${v}`;
				values += `${comma}'${conf.values[v]}'`;
				comma = ',';
			}
			values = `(${values})`;
		}
		else if(Array.isArray(conf.values))
		{
			if(conf.values.length == 0) return this.query_error('MYSQL: No values defined input in INSERT', callback);
			if(typeof(conf.values[0]) == 'object')//one insert values in one
			{
				let comma = '';
				tools.log(conf.values);
				for(v of conf.values)
				{
					tools.log(v);
					// for(f in v)
					// {
					// 	fields += `${comma}${f}`;
					// 	values += `${comma}'${v[f]}'`;
					// }
					// comma = ',';
				}
			}
		}

		let query = `INSERT INTO ${conf.table} (${fields}) VALUES ${values};`;
		// tools.log(query);
		this.query(query, (resp)=>
		{
			if(resp.err !== null) return this.query_error('MYSQL: Error in INSERT', callback);
			if(callback)
				callback({err: resp.err, id: resp.result.insertId});
		});
	},
	update: function(conf, callback)
	{
		if(!conf) return this.query_error('MYSQL: No data input defined in UPDATE', callback);
		if(typeof(conf) == 'string')
		{
			this.query(conf, callback);
			return;
		}
		if(!conf.table) return this.query_error('MYSQL: No table defined input in UPDATE', callback);

		let values = '';
		if(typeof(conf.fields) == 'object')
		{
			let comma = '';
			for(f in conf.fields)
			{
				values += `${comma}${f}='${conf.fields[f]}'`;
				comma = ',';
			}
		}
		let where = conf.where || '1';
		if(typeof(conf.where) == 'object')
		{
			where = '';
			if(conf.where.equal)
			{
				let cond_or = '';
				for(e of conf.where.equal)
				{
					let conds_val = '';
					let cond_and = '';
					for(f in e)
					{
						conds_val += `${cond_and} ${f}='${e[f]}'`;
						cond_and = ' and';
					}
					where += `${cond_or} (${conds_val})`;
					cond_or = ' or';
				}
			}
		}

		let query = `UPDATE ${conf.table} SET ${values} WHERE ${where};`;
		// tools.log(query);
		this.query(query, callback);
	},
	delete: function(){}
}

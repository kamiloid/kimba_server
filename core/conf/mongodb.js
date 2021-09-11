const {MongoClient, ObjectID} = require('mongodb');
const {tools} = require('./tools.js');

exports.mongo =
{
	_connected: false,
	_user: '',
	_pass: '',
	_db: '',
	_conn: '',
	_client: null,
	_connection_time: 0,
	is_connected:function(){return this._connected;},
	object_id: function(id){ return ObjectID(id);},
	setup:function(db, user, pass)
	{
		tools.log(user, pass);
		this._db = db;
		this._user = user;
		this._pass = pass;
		this._conn = `mongodb+srv://${this._user}:${this._pass}@cluster0.atexf.mongodb.net/${this._db}?retryWrites=true&w=majority`;
	},
	connect:function(cback)
	{
		this._client = new MongoClient(this._conn, { useNewUrlParser: true, useUnifiedTopology: true });
		let start_time = (new Date()).getTime();
		this._client.connect((err)=>{
			this._connected = true;
			this._connection_time = (new Date()).getTime() - start_time;
			tools.log(this._connection_time / 1000);
			tools.log(err);
			if(cback) cback();
		});
	},
	insert:function(collection, obj, cback)
	{
		if(this._client == null) return;
		this._client.db(this._db).collection(collection).insertOne(obj, (err, resp)=>
			{
				let arg = null;
				if(!err)
					arg = resp;
				if(cback)
					cback(arg);
			});
	},
	select:function(collection, where, cback)
	{
		if(this._client == null) return;
		this._client.db(this._db).collection(collection).find(where).toArray((err, resp)=>
			{
				let arg = null;
				if(!err)
					arg = resp;
				if(cback)
					cback(arg);
			});
	},
	delete: function(collection, where, cback)
	{
		this._client.db(this._db).collection(collection).deleteOne(where, (err, resp)=>
			{
				let arg = null;
				if(!err)
					arg = resp;
				if(cback)
					cback(arg);
			});
	},
	update: function(collection, set, where, cback)
	{
		this._client.db(this._db).collection(collection).updateOne(where, 
			{
				$set: set
			}, (err, resp)=>
			{
				let arg = null;
				if(!err)
					arg = resp;
				if(cback)
					cback(arg);
			});
	}
};

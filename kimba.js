//var bodyParser = require('body-parser');
const {app_conf, db_conf, serve_conf} = require('./core/conf/conf.js');
const {tools} = require('./core/conf/tools.js');
const {db} = require('./core/conf/dbconnector.js');
const express = require('express');
const {collections} = require('./core/collections.js');
const app = express();

tools.http2https(app);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.listen(serve_conf._port, () => {
  tools.log(`Serve app listening at ${serve_conf._port}`);
});

db.setup(db_conf);
db.connect(()=>
{
	tools.log('DB connected!!');
});

tools.cross_domaine(app, app_conf._prefix);

tools.protect_api(app, app_conf._prefix, (req, res)=>
{
	res.send(`Wellcome to ${app_conf._app_name} environment :)`);
});

app.get(`/${app_conf._prefix}`, (req, res) => {
	res.send(`Wellcome to ${app_conf._app_name} environment :)`);
});

app.post(`/${app_conf._prefix}/api`, function(req, res)
	{
		// if(!db.is_connected()) return;
		let input = req.body;
		if(input.a == null || input.a == undefined) return;
		if(input.cmd == null || input.cmd == undefined) return;

		const addon = {};
		addon[input.a] = require('./addons/'+input.a+'.js');
		let mod = addon[input.a][input.a];
		if(mod[input.cmd] == null || mod[input.cmd] == undefined) return;
		const args = {
			i: input.args,
			o: {},
			//db: (db ? db.public() : null),
			tools: tools,
			collections: collections
		};
		mod[input.cmd](args).then(output=>
			{
				res.send(output);
			});
	});

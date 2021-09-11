//var bodyParser = require('body-parser');
const {app_conf, db_conf, serve_conf} = require('./core/conf/conf.js');
const {tools} = require('./core/conf/tools.js');
const {mongo} = require('./core/conf/mongodb.js');
const {mysql} = require('./core/conf/mysql.js');
const express = require('express');
// const cors = require('cors');
const exp_session = require('express-session');
const {collections} = require('./core/collections.js');
const app = express();

tools.http2https(app);

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.listen(serve_conf._port, () => {
  tools.log(`Serve app listening at ${serve_conf._port}`);
});

mysql.setup(db_conf._mysql1.host, db_conf._mysql1.db, db_conf._mysql1.user, db_conf._mysql1.pass);
mysql.connect(()=>
	{
		tools.log('MySql connected!!');
	}, (err)=>
	{
		tools.log('MySql error!!');
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
		if(!mysql.connected()) return;
		let input = req.body;
		if(input.a == null || input.a == undefined) return;
		if(input.cmd == null || input.cmd == undefined) return;

        if(input.args.token !== null)
        {
            let current_session = serve_conf.check_session_by_ip_browser(input.args.token);
            if(current_session)
            {
    			let today = tools.date.now();
    			let expire = current_session.expire;
                if(current_session.token !== input.args.token)
                {
                    res.send({logged: false, error: true, message:'Invalid security token.'});
                    return;
                }else if(today.getTime() > expire.getTime())
                {
                    res.send({logged: false, error: false, message:'Session expired.'});
                    return;
                }
            }
        }

		const addon = {};
		addon[input.a] = require('./addons/'+input.a+'.js');
		let mod = addon[input.a][input.a];
		if(mod[input.cmd] == null || mod[input.cmd] == undefined) return;
		const args = {
			i: input.args,
			o: {error: false, message: 'no errors', session: {}},
			client: {
				ip: req.headers['x-forwarded-for'] || 'localhost',
				browser: req.headers['user-agent']
			},
			mysql: mysql ? mysql.public() : {},
			tools: tools,
			collections: collections,
			callback: (output)=> { res.send(output); },
            res: res,
            req: req
		};
		let caller = mod[input.cmd](args);
		if(!caller) return;
		if(caller.then !== undefined) return;
		mod[input.cmd](args).then(output=>
			{
				res.send(output);
			});
	});

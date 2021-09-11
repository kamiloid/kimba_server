var md5 = require('md5');
const {app_conf, db_conf, serve_conf} = require('./conf.js');

exports.tools =
{
	log:(args)=>
	{
		if(app_conf._debug)
			console.error(args);
	},
	cross_domaine:(http, app_prefix)=>
	{
		http.use(`${app_prefix}/api`, function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
		  next();
		 });
	},
	http2https:(http)=>
	{
		http.use(function(req, res, next) {
		    if (req.headers['x-forwarded-proto'] !== 'https')
		        return res.redirect('https://' + req.headers.host + req.url);
			next();
		});
	},
	protect_api:(http, app_prefix, cb=null)=>
	{
		http.get(`/${app_prefix}/*`, (req, res) => {
			if(req.url.includes(`${app_prefix}/api`))
				return res.redirect(`https://${req.headers.host}/${app_prefix}`);
			if(cb)
				cb(req, res);
		});
	},
	md5:(hint)=>
	{
		return md5(hint);
	},
	uid:function()
	{
		return this.md5((new Date()).getTime() * Math.random());
	},
	create_token:()=>
	{
		return this.uid() + Math.random() + this.uid();
	},
	date:
	{
		now:()=>
		{
			return new Date();
		},
		date:(d=null)=>
		{
			return d ? new Date(d) : this.now();
		},
		time: function(d=null)
		{
			return (!d ? new Date() : d).getTime();
		},
		add_days:(date, days=0)=>
		{
			let new_date = new Date(date);
			new_date.setTime(new_date.getTime() + (days * 24 * 60 * 60 * 1000));
			return new_date;
		},
		date_read:(d=null)=>
		{
			let now = !d ? new Date() : d;
			let month = now.getMonth() + 1;
			let date = now.getDate();

			month = month < 10 ? `0${month}` : month;
			date = date < 10 ? `0${date}` : date;
			return `${now.getFullYear()}-${month}-${date}`;
		},
		time_read:(d=null)=>
		{
			let now = !d ? new Date() : d;
			let h = now.getHours();
			let m = now.getMinutes();
			let s = now.getSeconds();

			h = h < 10 ? `0${h}` : h;
			m = m < 10 ? `0${m}` : m;
			s = s < 10 ? `0${s}` : s;

			return `${h}:${m}:${s}`;
		},
		date_time_read: function(d=null)
		{
			d = d || new Date();
			return `${this.date_read(d)} ${this.time_read(d)}`;
		},
		str_to_date_time:(str)=>
		{
			let split1 = str.split(' ');
			let datestr = split1[0];
			let timestr = split[1];

			let splitdate = datestr.split(':');
			let splittime = timestr.split(':');

			let y = parseInt(splitdate[0]);
			let mo = parseInt(splitdate[1]) - 1;
			let d = parseInt(splitdate[2]);

			let h = parseInt(splittime[0]);
			let mi = parseInt(splittime[1]);
			let s = parseInt(splittime[2]);

			return new Date(y, mo, d, h, mi, s);
		}
	}
}
